import { NextResponse } from "next/server";

import { requireSessionUser } from "@/server/auth/session";
import { getLeadImportTemplate, importLeadsFromRows, type ImportMapping } from "@/server/services/import-service";

export async function GET() {
  await requireSessionUser();
  return NextResponse.json(getLeadImportTemplate());
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = (await request.json()) as {
      rows?: Array<Record<string, string>>;
      mapping?: Record<string, string>;
      defaultOwnerId?: string | null;
      updateExisting?: boolean;
    };

    if (!payload.rows?.length || !payload.mapping) {
      return NextResponse.json({ error: "Envie as linhas e o mapeamento do CSV." }, { status: 400 });
    }

    const result = await importLeadsFromRows({
      rows: payload.rows,
      mapping: payload.mapping as ImportMapping,
      defaultOwnerId: payload.defaultOwnerId,
      updateExisting: payload.updateExisting,
      actor: { id: user.id, role: user.role }
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
