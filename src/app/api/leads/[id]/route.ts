import { NextResponse } from "next/server";

import { prisma } from "@/server/db/prisma";
import { leadSchema } from "@/server/schemas/lead";
import { updateLead } from "@/server/services/lead-service";
import { requireSessionUser } from "@/server/auth/session";

function normalizePayload(payload: Record<string, unknown>, user: { id: string; role: "ADMIN" | "SELLER" }) {
  return {
    ...payload,
    ownerId: user.role === "ADMIN" ? payload.ownerId : user.id,
    sourcePrimary: payload.sourcePrimary || "INSTAGRAM",
    sourceDetail: payload.sourceDetail || null,
    whatsapp: payload.whatsapp || null,
    email: payload.email || null,
    instagram: payload.instagram || null,
    company: payload.company || null,
    city: payload.city || null,
    state: payload.state || null,
    mainInterest: payload.mainInterest || null,
    investmentRange: payload.investmentRange || "UNDEFINED",
    urgency: payload.urgency || "MEDIUM",
    notes: payload.notes || null,
    lossReason: payload.lossReason || null,
    potentialValue: payload.potentialValue ? Number(payload.potentialValue) : null,
    closedValue: payload.closedValue ? Number(payload.closedValue) : null,
    attendedEvaluation: payload.attendedEvaluation === "true",
    closedAtEvaluation: payload.closedAtEvaluation === "true",
    whatsappTemplate: payload.whatsappTemplate || null,
    nextActionAt: payload.nextActionAt ? new Date(String(payload.nextActionAt)) : null
  };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser();
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id }, include: { owner: true } });

  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
  }

  if (user.role !== "ADMIN" && lead.ownerId !== user.id) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  return NextResponse.json(lead);
}

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

    const payload = normalizePayload((await request.json()) as Record<string, unknown>, user);
    const parsed = leadSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
    }

    const lead = await updateLead(id, parsed.data, user);
    return NextResponse.json({ id: lead.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
