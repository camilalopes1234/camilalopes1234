import { ActivityEntity, ConversationChannel, ConversationStatus, MessageDirection, MessageStatus, MessageType, SenderType } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { demoConversations } from "@/server/demo/data";
import { isDemoMode } from "@/server/demo/mode";
import { createActivityLog } from "@/server/services/activity-log-service";
import { normalizeWhatsappNumber, sendWhatsappMessage } from "@/server/services/whatsapp-service";

type Actor = {
  id: string;
  role: "ADMIN" | "SELLER";
};

export async function ensureWhatsappConversation(input: {
  leadId: string;
  ownerId?: string | null;
  phone?: string | null;
  subject?: string | null;
}) {
  if (isDemoMode) {
    const existing = demoConversations.find((conversation) => conversation.leadId === input.leadId && conversation.channel === ConversationChannel.WHATSAPP);
    if (existing) return existing;

    return {
      id: `demo-conv-${input.leadId}`,
      leadId: input.leadId,
      ownerId: input.ownerId ?? null,
      channel: ConversationChannel.WHATSAPP,
      status: ConversationStatus.OPEN,
      subject: input.subject ?? "Conversa WhatsApp",
      contactPhone: normalizeWhatsappNumber(input.phone),
      externalContactId: null,
      lastMessageAt: new Date(),
      botEnabled: true,
      botHandoffRequested: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      leadId: input.leadId,
      channel: ConversationChannel.WHATSAPP
    }
  });

  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      leadId: input.leadId,
      ownerId: input.ownerId,
      channel: ConversationChannel.WHATSAPP,
      status: ConversationStatus.OPEN,
      subject: input.subject,
      contactPhone: normalizeWhatsappNumber(input.phone)
    }
  });
}

export async function createOutboundMessage(input: {
  conversationId: string;
  type: MessageType;
  body: string;
  mediaUrl?: string | null;
  mimeType?: string | null;
  caption?: string | null;
  fileName?: string | null;
  userId: string;
}) {
  if (isDemoMode) {
    return {
      id: `demo-msg-${Date.now()}`,
      conversationId: input.conversationId,
      body: input.body,
      type: input.type,
      mediaUrl: input.mediaUrl ?? null,
      mimeType: input.mimeType ?? null,
      fileName: input.fileName ?? null,
      caption: input.caption ?? null,
      durationSeconds: null,
      userId: input.userId,
      senderType: SenderType.USER,
      direction: MessageDirection.OUTBOUND,
      status: MessageStatus.PENDING,
      externalMessageId: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: input.conversationId },
    include: { lead: true }
  });

  if (!conversation) {
    throw new Error("Conversa nao encontrada.");
  }

  const isInlineMedia = Boolean(input.mediaUrl?.startsWith("data:"));
  const sendResult =
    input.type !== MessageType.TEXT && isInlineMedia
      ? {
          provider: "crm-local-preview",
          configured: false,
          status: MessageStatus.PENDING,
          externalMessageId: null
        }
      : await sendWhatsappMessage({
          to: conversation.contactPhone || conversation.lead.whatsapp || conversation.lead.phone,
          type: input.type,
          body: input.body,
          mediaUrl: input.mediaUrl,
          mimeType: input.mimeType,
          caption: input.caption,
          fileName: input.fileName
        });

  const message = await prisma.message.create({
    data: {
      conversationId: input.conversationId,
      body: input.body,
      type: input.type,
      mediaUrl: input.mediaUrl,
      mimeType: input.mimeType,
      fileName: input.fileName,
      caption: input.caption,
      userId: input.userId,
      senderType: SenderType.USER,
      direction: MessageDirection.OUTBOUND,
      status: sendResult.status,
      externalMessageId: sendResult.externalMessageId
    }
  });

  await prisma.conversation.update({
    where: { id: input.conversationId },
    data: {
      lastMessageAt: message.createdAt,
      status: ConversationStatus.OPEN
    }
  });

  return message;
}

export async function handleIncomingWhatsappMessage(input: {
  externalContactId?: string | null;
  externalMessageId?: string | null;
  phone?: string | null;
  type: MessageType;
  body: string;
  mediaUrl?: string | null;
  mimeType?: string | null;
  caption?: string | null;
  fileName?: string | null;
  leadId: string;
  ownerId?: string | null;
}) {
  if (isDemoMode) {
    return {
      conversation: null,
      message: {
        id: `demo-inbound-${Date.now()}`,
        body: input.body,
        type: input.type
      }
    };
  }

  const conversation = await ensureWhatsappConversation({
    leadId: input.leadId,
    ownerId: input.ownerId,
    phone: input.phone,
    subject: "Conversa WhatsApp"
  });

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      body: input.body,
      type: input.type,
      mediaUrl: input.mediaUrl,
      mimeType: input.mimeType,
      fileName: input.fileName,
      caption: input.caption,
      senderType: SenderType.CUSTOMER,
      direction: MessageDirection.INBOUND,
      status: MessageStatus.READ,
      externalMessageId: input.externalMessageId
    }
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      externalContactId: input.externalContactId ?? undefined,
      lastMessageAt: message.createdAt,
      status: ConversationStatus.BOT_ACTIVE
    }
  });

  return { conversation, message };
}

export async function updateMessageStatusByExternalId(input: {
  externalMessageId?: string | null;
  status: MessageStatus;
}) {
  if (!input.externalMessageId || isDemoMode) return null;

  return prisma.message.updateMany({
    where: { externalMessageId: input.externalMessageId },
    data: { status: input.status }
  });
}

export async function requestHumanHandoff(conversationId: string, actor: Actor) {
  const conversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status: ConversationStatus.WAITING_HUMAN,
      botHandoffRequested: true
    }
  });

  await createActivityLog({
    userId: actor.id,
    entityType: ActivityEntity.CONVERSATION,
    entityId: conversationId,
    action: "conversation.handoff.requested",
    message: "Conversa sinalizada para atendimento humano.",
    leadId: conversation.leadId,
    conversationId
  });

  return conversation;
}
