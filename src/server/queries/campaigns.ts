import { MessageStatus, UserRole, WhatsAppCampaignRecipientStatus } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { demoLeads, demoUsers } from "@/server/demo/data";
import { isDemoMode } from "@/server/demo/mode";

type Actor = {
  id: string;
  role: UserRole;
};

export async function getWhatsappTemplates(actor: Actor) {
  if (isDemoMode) {
    return [
      {
        id: "demo-template-1",
        name: "reativacao_premium",
        displayName: "Reativacao premium",
        category: "MARKETING" as const,
        languageCode: "pt_BR",
        bodyText: "Oi {{primeiro_nome}}, aqui e {{responsavel}}. Separei uma condicao especial para {{interesse}}.",
        variableKeys: ["primeiro_nome", "responsavel", "interesse"],
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: demoUsers[0].id
      }
    ];
  }

  return prisma.whatsAppTemplate.findMany({
    where: actor.role === "ADMIN" ? {} : { OR: [{ createdById: actor.id }, { isApproved: true }] },
    orderBy: [{ isApproved: "desc" }, { displayName: "asc" }]
  });
}

export async function getWhatsappCampaigns(actor: Actor) {
  if (isDemoMode) {
    return [
      {
        id: "demo-campaign-1",
        title: "Reativacao leads quentes",
        description: "Campanha para retomar leads quentes sem resposta ha mais de 7 dias.",
        sendMode: "TEMPLATE" as const,
        status: "READY" as const,
        messageBody: "Oi {{primeiro_nome}}, aqui e {{responsavel}}. Posso te mostrar a condicao premium desta semana?",
        audienceSearch: null,
        filterStage: "NEGOTIATION" as const,
        filterSourcePrimary: "INSTAGRAM" as const,
        filterTemperature: "HOT" as const,
        filterOwnerId: demoUsers[0].id,
        filterCity: "Sao Paulo",
        requiresOptIn: true,
        recipientsCount: 3,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
        skippedCount: 0,
        scheduledAt: null,
        startedAt: null,
        completedAt: null,
        lastDispatchAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: demoUsers[0].id,
        templateId: "demo-template-1",
        template: {
          id: "demo-template-1",
          name: "reativacao_premium",
          displayName: "Reativacao premium",
          category: "MARKETING" as const,
          languageCode: "pt_BR",
          bodyText: "Oi {{primeiro_nome}}, aqui e {{responsavel}}. Separei uma condicao especial para {{interesse}}.",
          variableKeys: ["primeiro_nome", "responsavel", "interesse"],
          isApproved: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdById: demoUsers[0].id
        },
        createdBy: { name: demoUsers[0].name, role: demoUsers[0].role },
        recipients: demoLeads.slice(0, 4).map((lead, index) => ({
          id: `demo-recipient-${index + 1}`,
          campaignId: "demo-campaign-1",
          leadId: lead.id,
          conversationId: null,
          phone: lead.whatsapp || lead.phone,
          personalizedBody: `Oi ${lead.fullName.split(" ")[0]}, aqui e ${demoUsers[0].name}.`,
          status:
            index === 0
              ? ("READ" as const)
              : index === 1
                ? ("DELIVERED" as const)
                : index === 2
                  ? ("FAILED" as const)
                  : ("SKIPPED" as const),
          providerMessageId: null,
          failureReason: index === 2 ? "Numero sem WhatsApp ativo." : null,
          queuedAt: new Date(),
          lastTriedAt: new Date(),
          sentAt: index < 3 ? new Date() : null,
          deliveredAt: index <= 1 ? new Date() : null,
          readAt: index === 0 ? new Date() : null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lead
        }))
      }
    ];
  }

  return prisma.whatsAppCampaign.findMany({
    where: actor.role === "ADMIN" ? {} : { createdById: actor.id },
    include: {
      template: true,
      createdBy: {
        select: {
          name: true,
          role: true
        }
      },
      recipients: {
        include: {
          lead: true
        },
        orderBy: { createdAt: "asc" }
      }
    },
    orderBy: [{ createdAt: "desc" }]
  });
}

export async function getCampaignById(actor: Actor, id: string) {
  if (isDemoMode) {
    const campaigns = await getWhatsappCampaigns(actor);
    return campaigns.find((campaign) => campaign.id === id) ?? null;
  }

  return prisma.whatsAppCampaign.findFirst({
    where: actor.role === "ADMIN" ? { id } : { id, createdById: actor.id },
    include: {
      template: true,
      createdBy: {
        select: {
          name: true,
          role: true
        }
      },
      recipients: {
        include: {
          lead: true,
          conversation: true
        },
        orderBy: [{ createdAt: "asc" }]
      }
    }
  });
}

export async function syncCampaignDeliveryStatusByProviderMessage(externalMessageId: string, nextStatus: MessageStatus) {
  if (isDemoMode) return null;

  const recipientStatus =
    nextStatus === MessageStatus.READ
      ? WhatsAppCampaignRecipientStatus.READ
      : nextStatus === MessageStatus.DELIVERED
        ? WhatsAppCampaignRecipientStatus.DELIVERED
        : nextStatus === MessageStatus.FAILED
          ? WhatsAppCampaignRecipientStatus.FAILED
          : WhatsAppCampaignRecipientStatus.SENT;

  return prisma.whatsAppCampaignRecipient.updateMany({
    where: {
      providerMessageId: externalMessageId
    },
    data: {
      status: recipientStatus,
      deliveredAt: nextStatus === MessageStatus.DELIVERED ? new Date() : undefined,
      readAt: nextStatus === MessageStatus.READ ? new Date() : undefined
    }
  });
}
