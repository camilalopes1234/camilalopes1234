import { NextResponse } from "next/server";

import { requireSessionUser } from "@/server/auth/session";
import { getWhatsappCampaigns } from "@/server/queries/campaigns";
import { campaignSchema } from "@/server/schemas/campaign";
import { createCampaign } from "@/server/services/campaign-service";

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

export async function GET() {
  try {
    const user = await requireSessionUser();
    const campaigns = await getWhatsappCampaigns({ id: user.id, role: user.role });
    return NextResponse.json(campaigns);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = normalizeCampaignPayload((await request.json()) as Record<string, unknown>, user);
    const parsed = campaignSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados invalidos." }, { status: 400 });
    }

    const campaign = await createCampaign(parsed.data, { id: user.id, role: user.role });
    return NextResponse.json({ id: campaign.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
