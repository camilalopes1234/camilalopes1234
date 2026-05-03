import { NextResponse } from "next/server";

import { requireSessionUser } from "@/server/auth/session";
import { getWhatsappTemplates } from "@/server/queries/campaigns";
import { whatsappTemplateSchema } from "@/server/schemas/whatsapp-template";
import { createWhatsappTemplate } from "@/server/services/whatsapp-template-service";

function normalizeTemplatePayload(payload: Record<string, unknown>) {
  return {
    ...payload,
    variableKeys: payload.variableKeys || null,
    isApproved: payload.isApproved === "true" || payload.isApproved === true
  };
}

export async function GET() {
  try {
    const user = await requireSessionUser();
    const templates = await getWhatsappTemplates({ id: user.id, role: user.role });
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = normalizeTemplatePayload((await request.json()) as Record<string, unknown>);
    const parsed = whatsappTemplateSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados invalidos." }, { status: 400 });
    }

    const template = await createWhatsappTemplate(parsed.data, { id: user.id, role: user.role });
    return NextResponse.json({ id: template.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
