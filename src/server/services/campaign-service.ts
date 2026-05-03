import {
  ActivityEntity,
  LeadSourcePrimary,
  LeadStage,
  LeadTemperature,
  MessageType,
  MessageStatus,
  Prisma,
  WhatsAppCampaignRecipientStatus,
  WhatsAppCampaignSendMode,
  WhatsAppCampaignStatus,
  type UserRole
} from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { isDemoMode } from "@/server/demo/mode";
import { createActivityLog } from "@/server/services/activity-log-service";
import { createOutboundMessage, createOutboundTemplateMessage, ensureWhatsappConversation } from "@/server/services/conversation-service";
import { isWhatsappConfigured } from "@/server/services/whatsapp-service";

type Actor = {
  id: string;
  role: UserRole;
};

type CampaignInput = {
  title: string;
  description?: string | null;
  sendMode: WhatsAppCampaignSendMode;
  messageBody: string;
  templateId?: string | null;
  audienceSearch?: string | null;
  filterStage?: LeadStage | null;
  filterSourcePrimary?: LeadSourcePrimary | null;
  filterTemperature?: LeadTemperature | null;
  filterOwnerId?: string | null;
  filterCity?: string | null;
  requiresOptIn?: boolean;
  scheduledAt?: Date | null;
};

type CampaignWithTemplate = Prisma.WhatsAppCampaignGetPayload<{
  include: {
    template: true;
  };
}>;

function cleanNullableString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function getCampaignWhere(id: string, actor: Actor): Prisma.WhatsAppCampaignWhereUniqueInput & Prisma.WhatsAppCampaignWhereInput {
  return actor.role === "ADMIN" ? { id } : { id, createdById: actor.id };
}

function buildLeadAudienceWhere(input: CampaignInput, actor: Actor): Prisma.LeadWhereInput {
  const search = cleanNullableString(input.audienceSearch);
  const city = cleanNullableString(input.filterCity);

  return {
    ownerId: actor.role === "ADMIN" ? input.filterOwnerId || undefined : actor.id,
    stage: input.filterStage ?? undefined,
    sourcePrimary: input.filterSourcePrimary ?? undefined,
    temperature: input.filterTemperature ?? undefined,
    city: city ? { contains: city, mode: "insensitive" } : undefined,
    whatsapp: { not: null },
    OR: search
      ? [
          { fullName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { whatsapp: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } },
          { mainInterest: { contains: search, mode: "insensitive" } }
        ]
      : undefined
  };
}

function extractTemplateVariableKeys(bodyText: string) {
  const matches = bodyText.match(/{{\s*([\w.-]+)\s*}}/g) ?? [];
  return Array.from(new Set(matches.map((match) => match.replace(/[{}]/g, "").trim())));
}

function getLeadTokenValue(lead: {
  fullName: string;
  city: string | null;
  company: string | null;
  mainInterest: string | null;
  whatsapp: string | null;
  phone: string;
  owner: { name: string; title: string | null };
}) {
  const [firstName] = lead.fullName.split(" ");

  return {
    nome: lead.fullName,
    primeiro_nome: firstName || lead.fullName,
    cidade: lead.city || "",
    empresa: lead.company || "",
    interesse: lead.mainInterest || "",
    whatsapp: lead.whatsapp || lead.phone,
    responsavel: lead.owner.name,
    cargo_responsavel: lead.owner.title || ""
  };
}

function renderTemplateText(bodyText: string, lead: {
  fullName: string;
  city: string | null;
  company: string | null;
  mainInterest: string | null;
  whatsapp: string | null;
  phone: string;
  owner: { name: string; title: string | null };
}) {
  const replacements = getLeadTokenValue(lead);

  return bodyText.replace(/{{\s*([\w.-]+)\s*}}/g, (_, token: string) => {
    const key = token.trim().toLowerCase() as keyof typeof replacements;
    return replacements[key] ?? "";
  });
}

async function loadCampaignOrThrow(id: string, actor: Actor) {
  const campaign = await prisma.whatsAppCampaign.findFirst({
    where: getCampaignWhere(id, actor),
    include: {
      template: true
    }
  });

  if (!campaign) {
    throw new Error("Campanha nao encontrada.");
  }

  return campaign;
}

async function syncCampaignRecipients(campaign: CampaignWithTemplate, actor: Actor) {
  const leads = await prisma.lead.findMany({
    where: buildLeadAudienceWhere(campaign, actor),
    include: {
      owner: {
        select: {
          name: true,
          title: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const recipients = leads.map((lead) => ({
    campaignId: campaign.id,
    leadId: lead.id,
    phone: lead.whatsapp || lead.phone,
    personalizedBody: renderTemplateText(campaign.messageBody, lead),
    status: WhatsAppCampaignRecipientStatus.QUEUED
  }));

  await prisma.$transaction(async (tx) => {
    await tx.whatsAppCampaignRecipient.deleteMany({
      where: { campaignId: campaign.id }
    });

    if (recipients.length > 0) {
      await tx.whatsAppCampaignRecipient.createMany({
        data: recipients
      });
    }

    await tx.whatsAppCampaign.update({
      where: { id: campaign.id },
      data: {
        recipientsCount: recipients.length,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
        skippedCount: 0,
        status: recipients.length > 0 ? WhatsAppCampaignStatus.READY : WhatsAppCampaignStatus.DRAFT
      }
    });
  });

  return recipients.length;
}

export async function createCampaign(input: CampaignInput, actor: Actor) {
  if (isDemoMode) {
    return {
      id: `demo-campaign-${Date.now()}`
    };
  }

  const campaign = await prisma.whatsAppCampaign.create({
    data: {
      title: input.title.trim(),
      description: cleanNullableString(input.description),
      sendMode: input.sendMode,
      messageBody: input.messageBody.trim(),
      templateId: input.templateId || null,
      audienceSearch: cleanNullableString(input.audienceSearch),
      filterStage: input.filterStage ?? null,
      filterSourcePrimary: input.filterSourcePrimary ?? null,
      filterTemperature: input.filterTemperature ?? null,
      filterOwnerId: actor.role === "ADMIN" ? input.filterOwnerId || null : actor.id,
      filterCity: cleanNullableString(input.filterCity),
      requiresOptIn: input.requiresOptIn ?? false,
      scheduledAt: input.scheduledAt ?? null,
      createdById: actor.id
    },
    include: { template: true }
  });

  const recipientsCount = await syncCampaignRecipients(campaign, actor);

  await createActivityLog({
    userId: actor.id,
    entityType: ActivityEntity.WHATSAPP_CAMPAIGN,
    entityId: campaign.id,
    action: "whatsapp_campaign.created",
    message: `Campanha ${campaign.title} criada com ${recipientsCount} destinatarios.`,
    metadata: {
      sendMode: campaign.sendMode,
      templateId: campaign.templateId,
      recipientsCount
    }
  });

  return campaign;
}

export async function updateCampaign(id: string, input: CampaignInput, actor: Actor) {
  if (isDemoMode) {
    return { id };
  }

  await loadCampaignOrThrow(id, actor);

  const campaign = await prisma.whatsAppCampaign.update({
    where: { id },
    data: {
      title: input.title.trim(),
      description: cleanNullableString(input.description),
      sendMode: input.sendMode,
      messageBody: input.messageBody.trim(),
      templateId: input.templateId || null,
      audienceSearch: cleanNullableString(input.audienceSearch),
      filterStage: input.filterStage ?? null,
      filterSourcePrimary: input.filterSourcePrimary ?? null,
      filterTemperature: input.filterTemperature ?? null,
      filterOwnerId: actor.role === "ADMIN" ? input.filterOwnerId || null : actor.id,
      filterCity: cleanNullableString(input.filterCity),
      requiresOptIn: input.requiresOptIn ?? false,
      scheduledAt: input.scheduledAt ?? null
    },
    include: { template: true }
  });

  const recipientsCount = await syncCampaignRecipients(campaign, actor);

  await createActivityLog({
    userId: actor.id,
    entityType: ActivityEntity.WHATSAPP_CAMPAIGN,
    entityId: campaign.id,
    action: "whatsapp_campaign.updated",
    message: `Campanha ${campaign.title} atualizada.`,
    metadata: {
      recipientsCount,
      sendMode: campaign.sendMode,
      templateId: campaign.templateId
    }
  });

  return campaign;
}

export async function refreshCampaignMetrics(campaignId: string) {
  const [sentCount, deliveredCount, readCount, failedCount, skippedCount, recipientsCount] = await Promise.all([
    prisma.whatsAppCampaignRecipient.count({ where: { campaignId, status: WhatsAppCampaignRecipientStatus.SENT } }),
    prisma.whatsAppCampaignRecipient.count({ where: { campaignId, status: WhatsAppCampaignRecipientStatus.DELIVERED } }),
    prisma.whatsAppCampaignRecipient.count({ where: { campaignId, status: WhatsAppCampaignRecipientStatus.READ } }),
    prisma.whatsAppCampaignRecipient.count({ where: { campaignId, status: WhatsAppCampaignRecipientStatus.FAILED } }),
    prisma.whatsAppCampaignRecipient.count({ where: { campaignId, status: WhatsAppCampaignRecipientStatus.SKIPPED } }),
    prisma.whatsAppCampaignRecipient.count({ where: { campaignId } })
  ]);

  return prisma.whatsAppCampaign.update({
    where: { id: campaignId },
    data: {
      recipientsCount,
      sentCount,
      deliveredCount,
      readCount,
      failedCount,
      skippedCount
    }
  });
}

export async function dispatchCampaign(id: string, actor: Actor) {
  if (!isWhatsappConfigured()) {
    throw new Error("Configure o WhatsApp oficial antes de disparar uma campanha.");
  }

  if (isDemoMode) {
    return { processed: 0 };
  }

  const campaign = await loadCampaignOrThrow(id, actor);

  if (campaign.sendMode === WhatsAppCampaignSendMode.TEMPLATE && !campaign.template) {
    throw new Error("Template da campanha nao encontrado.");
  }

  await prisma.whatsAppCampaign.update({
    where: { id: campaign.id },
    data: {
      status: WhatsAppCampaignStatus.PROCESSING,
      startedAt: new Date(),
      lastDispatchAt: new Date()
    }
  });

  const recipients = await prisma.whatsAppCampaignRecipient.findMany({
    where: {
      campaignId: campaign.id,
      status: {
        in: [WhatsAppCampaignRecipientStatus.QUEUED, WhatsAppCampaignRecipientStatus.FAILED]
      }
    },
    include: {
      lead: {
        include: {
          owner: {
            select: {
              name: true,
              title: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  let processed = 0;

  for (const recipient of recipients) {
    try {
      const conversation = await ensureWhatsappConversation({
        leadId: recipient.leadId,
        ownerId: recipient.lead.ownerId,
        phone: recipient.phone,
        subject: campaign.title
      });

      const renderedBody = renderTemplateText(campaign.messageBody, recipient.lead);
      let message;

      if (campaign.sendMode === WhatsAppCampaignSendMode.TEMPLATE && campaign.template) {
        const variableKeys = Array.isArray(campaign.template.variableKeys) ? (campaign.template.variableKeys as string[]) : extractTemplateVariableKeys(campaign.template.bodyText);
        const tokens = getLeadTokenValue(recipient.lead);
        const bodyVariables = variableKeys.map((key) => tokens[key.trim().toLowerCase() as keyof typeof tokens] ?? "");

        message = await createOutboundTemplateMessage({
          conversationId: conversation.id,
          body: renderedBody,
          templateName: campaign.template.name,
          languageCode: campaign.template.languageCode,
          bodyVariables,
          userId: actor.id
        });
      } else {
        message = await createOutboundMessage({
          conversationId: conversation.id,
          type: MessageType.TEXT,
          body: renderedBody,
          userId: actor.id
        });
      }

      await prisma.whatsAppCampaignRecipient.update({
        where: { id: recipient.id },
        data: {
          conversationId: conversation.id,
          personalizedBody: renderedBody,
          providerMessageId: message.externalMessageId,
          status:
            message.status === MessageStatus.READ
              ? WhatsAppCampaignRecipientStatus.READ
              : message.status === MessageStatus.DELIVERED
                ? WhatsAppCampaignRecipientStatus.DELIVERED
                : message.status === MessageStatus.FAILED
                  ? WhatsAppCampaignRecipientStatus.FAILED
                  : WhatsAppCampaignRecipientStatus.SENT,
          failureReason: null,
          lastTriedAt: new Date(),
          sentAt: new Date()
        }
      });
    } catch (error) {
      await prisma.whatsAppCampaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: WhatsAppCampaignRecipientStatus.FAILED,
          failureReason: error instanceof Error ? error.message : "Falha desconhecida.",
          lastTriedAt: new Date()
        }
      });
    }

    processed += 1;
  }

  const updated = await refreshCampaignMetrics(campaign.id);

  const finalStatus =
    updated.failedCount > 0 && updated.sentCount === 0 && updated.deliveredCount === 0 && updated.readCount === 0
      ? WhatsAppCampaignStatus.FAILED
      : WhatsAppCampaignStatus.COMPLETED;

  await prisma.whatsAppCampaign.update({
    where: { id: campaign.id },
    data: {
      status: finalStatus,
      completedAt: new Date()
    }
  });

  await createActivityLog({
    userId: actor.id,
    entityType: ActivityEntity.WHATSAPP_CAMPAIGN,
    entityId: campaign.id,
    action: "whatsapp_campaign.dispatched",
    message: `Campanha ${campaign.title} disparada para ${processed} destinatarios.`,
    metadata: {
      processed,
      finalStatus
    }
  });

  return { processed };
}
