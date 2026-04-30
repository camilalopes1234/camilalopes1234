import { NextResponse } from "next/server";

import { prisma } from "@/server/db/prisma";
import { requireSessionUser } from "@/server/auth/session";
import { isDemoMode } from "@/server/demo/mode";
import { demoLeads } from "@/server/demo/data";
import { ensureWhatsappConversation } from "@/server/services/conversation-service";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await params;

    const lead = isDemoMode
      ? demoLeads.find((item) => item.id === id) ?? null
      : await prisma.lead.findUnique({
          where: { id }
        });

    if (!lead) {
      return NextResponse.json({ error: "Lead nao encontrado." }, { status: 404 });
    }

    if (user.role !== "ADMIN" && lead.ownerId !== user.id) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const conversation = await ensureWhatsappConversation({
      leadId: lead.id,
      ownerId: lead.ownerId,
      phone: lead.whatsapp || lead.phone,
      subject: `WhatsApp - ${lead.fullName}`
    });

    return NextResponse.json({ id: conversation.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
