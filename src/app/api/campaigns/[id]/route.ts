import { NextResponse } from "next/server";

import { requireSessionUser } from "@/server/auth/session";
import { campaignSchema } from "@/server/schemas/campaign";
import { updateCampaign } from "@/server/services/campaign-service";

function normalizeCampaignPayload(payload: Record<string, unknown>, user: { id: string; role: "ADMIN" | "SELLER" }) {
  return {
    ...payload,
    description: payload.description || null,
    messageBody: payload.messageBody || null,
    mediaUrl: payload.mediaUrl || null,
    mimeType: payload.mimeType || null,
    mediaCaption: payload.mediaCaption || null,
    mediaFileName: payload.mediaFileName || null,
    templateId: payload.templateId || null,
    audienceSearch: payload.audienceSearch || null,
    filterStage: payload.filterStage || null,
    filterSourcePrimary: payload.filterSourcePrimary || null,
    filterTemperature: payload.filterTemperature || null,
    filterOwnerId: user.role === "ADMIN" ? payload.filterOwnerId || null : user.id,
    filterCity: payload.filterCity || null,
    requiresOptIn: payload.requiresOptIn === "true" || payload.requiresOptIn === true,
    scheduledAt: payload.scheduledAt ? new Date(String(payload.scheduledAt)) : null
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await params;
    const payload = normalizeCampaignPayload((await request.json()) as Record<string, unknown>, user);
    const parsed = campaignSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados invalidos." }, { status: 400 });
    }

    await updateCampaign(id, parsed.data, { id: user.id, role: user.role });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
