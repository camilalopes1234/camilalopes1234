import { NextResponse } from "next/server";

import { requireSessionUser } from "@/server/auth/session";
import { dispatchCampaignWithMode } from "@/server/services/campaign-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await params;
    const payload = ((await request.json().catch(() => ({}))) as { mode?: "all" | "failed" }) ?? {};
    const result = await dispatchCampaignWithMode(id, { id: user.id, role: user.role }, payload.mode === "failed" ? "failed" : "all");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
