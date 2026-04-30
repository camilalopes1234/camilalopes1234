import { NextResponse } from "next/server";
import { MessageType } from "@prisma/client";
import { z } from "zod";

import { requireSessionUser } from "@/server/auth/session";
import { getConversation } from "@/server/queries/conversations";
import { createOutboundMessage } from "@/server/services/conversation-service";

const messageSchema = z.object({
  type: z.nativeEnum(MessageType).default(MessageType.TEXT),
  body: z.string().optional().default(""),
  mediaUrl: z
    .string()
    .refine((value) => !value || value.startsWith("data:") || /^https?:\/\//.test(value), "Informe uma URL publica ou arquivo valido.")
    .optional()
    .nullable(),
  mimeType: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
  fileName: z.string().optional().nullable()
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await params;
    const conversation = await getConversation({ id: user.id, role: user.role }, id);

    if (!conversation) {
      return NextResponse.json({ error: "Conversa nao encontrada." }, { status: 404 });
    }

    const payload = await request.json();
    const parsed = messageSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados invalidos." }, { status: 400 });
    }

    const message = await createOutboundMessage({
      conversationId: id,
      type: parsed.data.type,
      body: parsed.data.body,
      mediaUrl: parsed.data.mediaUrl,
      mimeType: parsed.data.mimeType,
      caption: parsed.data.caption,
      fileName: parsed.data.fileName,
      userId: user.id
    });

    return NextResponse.json({ id: message.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
