import { NextResponse } from "next/server";

import { prisma } from "@/server/db/prisma";
import { requireSessionUser } from "@/server/auth/session";
import { opportunitySchema } from "@/server/schemas/opportunity";

export async function GET() {
  const user = await requireSessionUser();

  const opportunities = await prisma.opportunity.findMany({
    where: user.role === "ADMIN" ? {} : { ownerId: user.id },
    include: { lead: true, owner: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(opportunities);
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = (await request.json()) as Record<string, unknown>;
    const parsed = opportunitySchema.safeParse({
      ...payload,
      ownerId: user.role === "ADMIN" ? payload.ownerId : user.id,
      estimatedValue: payload.estimatedValue ? Number(payload.estimatedValue) : null,
      finalValue: payload.finalValue ? Number(payload.finalValue) : null,
      sentAt: payload.sentAt ? new Date(String(payload.sentAt)) : null,
      returnAt: payload.returnAt ? new Date(String(payload.returnAt)) : null,
      notes: payload.notes || null
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: parsed.data.leadId } });
    if (!lead) {
      return NextResponse.json({ error: "Lead vinculado não encontrado." }, { status: 404 });
    }

    if (user.role !== "ADMIN" && (lead.ownerId !== user.id || parsed.data.ownerId !== user.id)) {
      return NextResponse.json({ error: "Você só pode registrar propostas dos seus próprios leads." }, { status: 403 });
    }

    const opportunity = await prisma.opportunity.create({ data: parsed.data });
    return NextResponse.json({ id: opportunity.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
