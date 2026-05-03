import { NextResponse } from "next/server";

import { requireSessionUser } from "@/server/auth/session";
import { dispatchCampaign } from "@/server/services/campaign-service";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await params;
    const result = await dispatchCampaign(id, { id: user.id, role: user.role });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
