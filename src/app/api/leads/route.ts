import { NextResponse } from "next/server";

import { prisma } from "@/server/db/prisma";
import { leadSchema } from "@/server/schemas/lead";
import { createLead } from "@/server/services/lead-service";
import { requireSessionUser } from "@/server/auth/session";

function normalizeLeadPayload(payload: Record<string, unknown>, user: { id: string; role: "ADMIN" | "SELLER" }) {
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

export async function GET(request: Request) {
  const user = await requireSessionUser();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;

  const leads = await prisma.lead.findMany({
    where: {
      ownerId: user.role === "ADMIN" ? searchParams.get("ownerId") || undefined : user.id,
      OR: q
        ? [
            { fullName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { instagram: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } }
          ]
        : undefined
    },
    include: { owner: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(leads);
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = normalizeLeadPayload((await request.json()) as Record<string, unknown>, user);
    const parsed = leadSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
    }

    if (user.role !== "ADMIN" && parsed.data.ownerId !== user.id) {
      return NextResponse.json({ error: "Você não pode atribuir leads para outro usuário." }, { status: 403 });
    }

    const lead = await createLead(parsed.data, user);
    return NextResponse.json({ id: lead.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
