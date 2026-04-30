import { NextResponse } from "next/server";

import { prisma } from "@/server/db/prisma";
import { requireSessionUser } from "@/server/auth/session";
import { interactionSchema } from "@/server/schemas/interaction";
import { createInteraction } from "@/server/services/lead-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await params;
    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
    }

    if (user.role !== "ADMIN" && lead.ownerId !== user.id) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const parsed = interactionSchema.safeParse({
      ...payload,
      occurredAt: payload.occurredAt ? new Date(String(payload.occurredAt)) : new Date(),
      nextActionAt: payload.nextActionAt ? new Date(String(payload.nextActionAt)) : null
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
    }

    await createInteraction(
      id,
      {
        type: parsed.data.type,
        occurredAt: parsed.data.occurredAt,
        content: parsed.data.content,
        nextActionAt: parsed.data.nextActionAt,
        userId: user.id,
        leadId: id
      },
      user
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
