import { MessageDirection, MessageStatus, MessageType, SenderType } from "@prisma/client";

export function normalizeWhatsappNumber(value?: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function buildWhatsappUrl(number?: string | null, message?: string | null) {
  const normalized = normalizeWhatsappNumber(number);
  if (!normalized) return null;

  const url = new URL(`https://wa.me/${normalized}`);
  if (message) {
    url.searchParams.set("text", message);
  }

  return url.toString();
}

export function getWhatsappConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN
  };
}

export function isWhatsappConfigured() {
  const config = getWhatsappConfig();
  return Boolean(config.accessToken && config.phoneNumberId);
}

export async function sendWhatsappMessage(input: {
  to: string;
  type: MessageType;
  body?: string;
  mediaUrl?: string | null;
  mimeType?: string | null;
  caption?: string | null;
  fileName?: string | null;
}) {
  const config = getWhatsappConfig();
  const normalized = normalizeWhatsappNumber(input.to);

  if (!config.accessToken || !config.phoneNumberId || !normalized) {
    return {
      provider: "whatsapp-cloud-api",
      configured: false,
      status: MessageStatus.PENDING,
      externalMessageId: null
    };
  }

  const response = await fetch(`https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(
      input.type === MessageType.TEXT
        ? {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: normalized,
            type: "text",
            text: {
              preview_url: false,
              body: input.body
            }
          }
        : input.type === MessageType.IMAGE
          ? {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: normalized,
              type: "image",
              image: {
                link: input.mediaUrl,
                caption: input.caption || undefined
              }
            }
          : input.type === MessageType.VIDEO
            ? {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: normalized,
                type: "video",
                video: {
                  link: input.mediaUrl,
                  caption: input.caption || undefined
                }
              }
            : input.type === MessageType.AUDIO
              ? {
                  messaging_product: "whatsapp",
                  recipient_type: "individual",
                  to: normalized,
                  type: "audio",
                  audio: {
                    link: input.mediaUrl
                  }
                }
              : {
                  messaging_product: "whatsapp",
                  recipient_type: "individual",
                  to: normalized,
                  type: "document",
                  document: {
                    link: input.mediaUrl,
                    caption: input.caption || undefined,
                    filename: input.fileName || "arquivo"
                  }
                }
    )
  });

  const data = (await response.json()) as {
    messages?: Array<{ id: string }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Falha ao enviar mensagem para o WhatsApp.");
  }

  return {
    provider: "whatsapp-cloud-api",
    configured: true,
    status: MessageStatus.SENT,
    externalMessageId: data.messages?.[0]?.id ?? null
  };
}

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: {
          phone_number_id?: string;
        };
        contacts?: Array<{
          wa_id?: string;
          profile?: { name?: string };
        }>;
        messages?: Array<{
          id?: string;
          from?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
          image?: { caption?: string; mime_type?: string; id?: string };
          video?: { caption?: string; mime_type?: string; id?: string };
          audio?: { mime_type?: string; id?: string };
          document?: { filename?: string; caption?: string; mime_type?: string; id?: string };
          interactive?: {
            button_reply?: { title?: string; id?: string };
            list_reply?: { title?: string; id?: string };
          };
        }>;
        statuses?: Array<{
          id?: string;
          status?: "sent" | "delivered" | "read" | "failed";
          timestamp?: string;
        }>;
      };
    }>;
  }>;
};

export function parseWhatsappWebhook(payload: MetaWebhookPayload) {
  const inboundMessages: Array<{
    externalMessageId: string | null;
    from: string | null;
    type: MessageType;
    body: string;
    mediaId: string | null;
    mimeType: string | null;
    fileName: string | null;
    caption: string | null;
    timestamp: Date;
    senderType: SenderType;
    direction: MessageDirection;
    phoneNumberId: string | null;
  }> = [];

  const statusUpdates: Array<{
    externalMessageId: string | null;
    status: MessageStatus;
    timestamp: Date;
  }> = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id ?? null;

      for (const message of value?.messages ?? []) {
        const body =
          message.text?.body ??
          message.interactive?.button_reply?.title ??
          message.interactive?.list_reply?.title ??
          "";

        const type =
          message.type === "audio"
            ? MessageType.AUDIO
            : message.type === "image"
              ? MessageType.IMAGE
              : message.type === "video"
                ? MessageType.VIDEO
                : message.type === "document"
                  ? MessageType.DOCUMENT
                  : MessageType.TEXT;

        inboundMessages.push({
          externalMessageId: message.id ?? null,
          from: normalizeWhatsappNumber(message.from) ?? null,
          type,
          body,
          mediaId: message.audio?.id ?? message.image?.id ?? message.video?.id ?? message.document?.id ?? null,
          mimeType: message.audio?.mime_type ?? message.image?.mime_type ?? message.video?.mime_type ?? message.document?.mime_type ?? null,
          fileName: message.document?.filename ?? null,
          caption: message.image?.caption ?? message.video?.caption ?? message.document?.caption ?? null,
          timestamp: message.timestamp ? new Date(Number(message.timestamp) * 1000) : new Date(),
          senderType: SenderType.CUSTOMER,
          direction: MessageDirection.INBOUND,
          phoneNumberId
        });
      }

      for (const status of value?.statuses ?? []) {
        const mappedStatus =
          status.status === "read"
            ? MessageStatus.READ
            : status.status === "delivered"
              ? MessageStatus.DELIVERED
              : status.status === "failed"
                ? MessageStatus.FAILED
                : MessageStatus.SENT;

        statusUpdates.push({
          externalMessageId: status.id ?? null,
          status: mappedStatus,
          timestamp: status.timestamp ? new Date(Number(status.timestamp) * 1000) : new Date()
        });
      }
    }
  }

  return { inboundMessages, statusUpdates };
}

export async function sendWhatsappTemplate(input: {
  to: string;
  templateName: string;
  languageCode?: string | null;
  bodyVariables?: string[];
}) {
  const config = getWhatsappConfig();
  const normalized = normalizeWhatsappNumber(input.to);

  if (!config.accessToken || !config.phoneNumberId || !normalized) {
    return {
      provider: "whatsapp-cloud-api",
      configured: false,
      status: MessageStatus.PENDING,
      externalMessageId: null
    };
  }

  const response = await fetch(`https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalized,
      type: "template",
      template: {
        name: input.templateName,
        language: {
          code: input.languageCode || "pt_BR"
        },
        components:
          input.bodyVariables && input.bodyVariables.length > 0
            ? [
                {
                  type: "body",
                  parameters: input.bodyVariables.map((value) => ({
                    type: "text",
                    text: value
                  }))
                }
              ]
            : undefined
      }
    })
  });

  const data = (await response.json()) as {
    messages?: Array<{ id: string }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Falha ao enviar template para o WhatsApp.");
  }

  return {
    provider: "whatsapp-cloud-api",
    configured: true,
    status: MessageStatus.SENT,
    externalMessageId: data.messages?.[0]?.id ?? null
  };
}
