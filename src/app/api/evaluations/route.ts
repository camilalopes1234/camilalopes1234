import { NextResponse } from "next/server";

import { prisma } from "@/server/db/prisma";
import { requireSessionUser } from "@/server/auth/session";
import { evaluationSchema } from "@/server/schemas/evaluation";
import { createEvaluation } from "@/server/services/evaluation-service";

export async function GET() {
  const user = await requireSessionUser();

  const evaluations = await prisma.evaluation.findMany({
    where: user.role === "ADMIN" ? {} : { ownerId: user.id },
    include: { lead: true, owner: true },
    orderBy: { scheduledAt: "asc" }
  });

  return NextResponse.json(evaluations);
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = (await request.json()) as Record<string, unknown>;
    const parsed = evaluationSchema.safeParse({
      scheduledAt: payload.scheduledAt ? new Date(String(payload.scheduledAt)) : undefined,
      status: payload.status || "SCHEDULED",
      attended: payload.attended === "true" ? true : payload.attended === "false" ? false : null,
      preNotes: payload.preNotes || null,
      postNotes: payload.postNotes || null,
      leadId: payload.leadId,
      ownerId: user.role === "ADMIN" ? payload.ownerId : user.id
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados invalidos." }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: parsed.data.leadId } });
    if (!lead) {
      return NextResponse.json({ error: "Lead nao encontrado." }, { status: 404 });
    }

    if (user.role !== "ADMIN" && lead.ownerId !== user.id) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const evaluation = await createEvaluation(parsed.data, user);
    return NextResponse.json({ id: evaluation.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
