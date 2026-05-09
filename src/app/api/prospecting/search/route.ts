import { NextResponse } from "next/server";

import { requireSessionUser } from "@/server/auth/session";
import { prospectingSearchSchema } from "@/server/schemas/prospecting";
import { searchProspects } from "@/server/services/prospecting-service";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = await request.json();
    const input = prospectingSearchSchema.parse(payload);

    const result = await searchProspects(input, {
      id: user.id,
      role: user.role
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel executar a prospeccao." },
      { status: 400 }
    );
  }
}
