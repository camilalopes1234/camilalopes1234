import { NextResponse } from "next/server";

import { demoLeads } from "@/server/demo/data";
import { isDemoMode } from "@/server/demo/mode";
import { prisma } from "@/server/db/prisma";
import { handleIncomingWhatsappMessage, updateMessageStatusByExternalId } from "@/server/services/conversation-service";
import { getWhatsappConfig, normalizeWhatsappNumber, parseWhatsappWebhook } from "@/server/services/whatsapp-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const challenge = url.searchParams.get("hub.challenge");
  const verifyToken = url.searchParams.get("hub.verify_token");

  if (mode === "subscribe" && challenge && verifyToken === getWhatsappConfig().verifyToken) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ ok: false }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { inboundMessages, statusUpdates } = parseWhatsappWebhook(payload);

    for (const statusUpdate of statusUpdates) {
      await updateMessageStatusByExternalId({
        externalMessageId: statusUpdate.externalMessageId,
        status: statusUpdate.status
      });
    }

    for (const message of inboundMessages) {
      const lead = isDemoMode
        ? demoLeads.find((item) => normalizeWhatsappNumber(item.whatsapp || item.phone) === message.from) ?? null
        : await prisma.lead.findFirst({
            where: {
              OR: [{ whatsapp: message.from ?? undefined }, { phone: message.from ?? undefined }]
            }
          });

      if (!lead || !message.from) {
        continue;
      }

      await handleIncomingWhatsappMessage({
        externalContactId: message.from,
        externalMessageId: message.externalMessageId,
        phone: message.from,
        type: message.type,
        body: message.body,
        mediaUrl: message.mediaId ? `https://graph.facebook.com/v22.0/${message.mediaId}` : null,
        mimeType: message.mimeType,
        fileName: message.fileName,
        caption: message.caption,
        leadId: lead.id,
        ownerId: lead.ownerId
      });
    }

    return NextResponse.json({
      ok: true,
      received: true,
      inboundProcessed: inboundMessages.length,
      statusesProcessed: statusUpdates.length
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
