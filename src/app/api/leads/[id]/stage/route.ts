import { NextResponse } from "next/server";

import { prisma } from "@/server/db/prisma";
import { leadStageSchema } from "@/server/schemas/lead";
import { moveLeadStage } from "@/server/services/lead-service";
import { requireSessionUser } from "@/server/auth/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await params;
    const currentLead = await prisma.lead.findUnique({ where: { id } });

    if (!currentLead) {
      return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
    }

    if (user.role !== "ADMIN" && currentLead.ownerId !== user.id) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const parsed = leadStageSchema.safeParse({
      stage: payload.stage,
      closedValue: payload.closedValue ? Number(payload.closedValue) : null,
      lossReason: payload.lossReason || null
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
    }

    await moveLeadStage(id, parsed.data, user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
