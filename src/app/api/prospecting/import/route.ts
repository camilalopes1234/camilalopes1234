import { NextResponse } from "next/server";

import { requireSessionUser } from "@/server/auth/session";
import { prospectingImportSchema } from "@/server/schemas/prospecting";
import { importProspectsToLeads } from "@/server/services/prospecting-service";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = await request.json();
    const input = prospectingImportSchema.parse(payload);

    const result = await importProspectsToLeads({
      items: input.items,
      ownerId: input.ownerId,
      updateExisting: input.updateExisting,
      actor: {
        id: user.id,
        role: user.role
      }
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel importar os prospects." },
      { status: 400 }
    );
  }
}
