import { ActivityEntity, EvaluationStatus, LeadStage, Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { createActivityLog } from "@/server/services/activity-log-service";

type Actor = {
  id: string;
  role: "ADMIN" | "SELLER";
};

export async function createEvaluation(data: Prisma.EvaluationUncheckedCreateInput, actor: Actor) {
  const evaluation = await prisma.evaluation.create({ data });

  await prisma.lead.update({
    where: { id: data.leadId },
    data: {
      stage: LeadStage.SCHEDULED
    }
  });

  await createActivityLog({
    userId: actor.id,
    entityType: ActivityEntity.EVALUATION,
    entityId: evaluation.id,
    action: "evaluation.created",
    message: "Avaliacao agendada.",
    leadId: data.leadId,
    evaluationId: evaluation.id
  });

  return evaluation;
}

export async function updateEvaluationStatus(
  id: string,
  data: { status: EvaluationStatus; attended?: boolean | null; postNotes?: string | null },
  actor: Actor
) {
  const evaluation = await prisma.evaluation.update({
    where: { id },
    data
  });

  await prisma.lead.update({
    where: { id: evaluation.leadId },
    data: {
      attendedEvaluation: data.attended ?? undefined,
      stage: data.status === EvaluationStatus.COMPLETED ? LeadStage.EVALUATION_COMPLETED : undefined
    }
  });

  await createActivityLog({
    userId: actor.id,
    entityType: ActivityEntity.EVALUATION,
    entityId: id,
    action: "evaluation.updated",
    message: `Avaliacao atualizada para ${data.status}.`,
    leadId: evaluation.leadId,
    evaluationId: id
  });

  return evaluation;
}
