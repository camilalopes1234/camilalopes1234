import { ActivityEntity, LeadStage, LeadStatus, Prisma, TaskStatus } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { createActivityLog } from "@/server/services/activity-log-service";
import { syncLeadFollowUpTask } from "@/server/services/task-service";
import { normalizeWhatsappNumber } from "@/server/services/whatsapp-service";

type Actor = {
  id: string;
  role: "ADMIN" | "SELLER";
};

export async function createLead(data: Prisma.LeadUncheckedCreateInput, actor: Actor) {
  const lead = await prisma.lead.create({
    data: {
      ...data,
      whatsapp: normalizeWhatsappNumber(data.whatsapp),
      stage: LeadStage.NEW,
      status: LeadStatus.ACTIVE
    }
  });

  await syncLeadFollowUpTask({
    leadId: lead.id,
    ownerId: lead.ownerId,
    dueDate: lead.nextActionAt,
    title: `Proxima acao: ${lead.fullName}`
  });

  await createActivityLog({
    userId: actor.id,
    entityType: ActivityEntity.LEAD,
    entityId: lead.id,
    action: "lead.created",
    message: `Lead ${lead.fullName} cadastrado.`,
    leadId: lead.id
  });

  return lead;
}

export async function updateLead(id: string, data: Prisma.LeadUncheckedUpdateInput, actor: Actor) {
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...data,
      whatsapp: typeof data.whatsapp === "string" ? normalizeWhatsappNumber(data.whatsapp) : data.whatsapp
    }
  });

  await syncLeadFollowUpTask({
    leadId: lead.id,
    ownerId: lead.ownerId,
    dueDate: lead.nextActionAt,
    title: `Proxima acao: ${lead.fullName}`
  });

  await createActivityLog({
    userId: actor.id,
    entityType: ActivityEntity.LEAD,
    entityId: id,
    action: "lead.updated",
    message: `Lead ${lead.fullName} atualizado.`,
    leadId: id
  });

  return lead;
}

export async function moveLeadStage(
  id: string,
  input: { stage: LeadStage; closedValue?: number | null; lossReason?: string | null },
  actor: Actor
) {
  if (input.stage === LeadStage.LOST && !input.lossReason) {
    throw new Error("Motivo de perda e obrigatorio.");
  }

  const data: Prisma.LeadUncheckedUpdateInput = {
    stage: input.stage,
    status:
      input.stage === LeadStage.CLOSED ? LeadStatus.WON : input.stage === LeadStage.LOST ? LeadStatus.LOST : LeadStatus.ACTIVE,
    closedValue: input.stage === LeadStage.CLOSED ? input.closedValue ?? undefined : null,
    lossReason: input.stage === LeadStage.LOST ? input.lossReason : null
  };

  const lead = await prisma.lead.update({
    where: { id },
    data
  });

  if (input.stage === LeadStage.CLOSED) {
    await prisma.task.updateMany({
      where: { leadId: id, status: TaskStatus.PENDING },
      data: { status: TaskStatus.COMPLETED, completedAt: new Date() }
    });
  }

  await createActivityLog({
    userId: actor.id,
    entityType: ActivityEntity.LEAD,
    entityId: id,
    action: "lead.stage.updated",
    message: `Lead movido para ${input.stage}.`,
    leadId: id,
    metadata: input
  });

  return lead;
}

export async function createInteraction(
  leadId: string,
  data: Prisma.InteractionUncheckedCreateInput & { nextActionAt?: Date | null },
  actor: Actor
) {
  const interaction = await prisma.interaction.create({
    data: {
      type: data.type,
      occurredAt: data.occurredAt,
      content: data.content,
      nextActionAt: data.nextActionAt,
      userId: data.userId,
      leadId: data.leadId
    }
  });

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      lastInteractionAt: interaction.occurredAt,
      nextActionAt: data.nextActionAt ?? undefined
    }
  });

  await syncLeadFollowUpTask({
    leadId,
    ownerId: lead.ownerId,
    dueDate: lead.nextActionAt,
    title: `Proxima acao: ${lead.fullName}`
  });

  await createActivityLog({
    userId: actor.id,
    entityType: ActivityEntity.INTERACTION,
    entityId: interaction.id,
    action: "interaction.created",
    message: `Nova interacao registrada para ${lead.fullName}.`,
    leadId
  });

  return interaction;
}
