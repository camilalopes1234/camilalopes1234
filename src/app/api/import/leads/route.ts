import { NextResponse } from "next/server";

import { requireSessionUser } from "@/server/auth/session";
import { getLeadImportTemplate } from "@/server/services/import-service";

export async function GET() {
  await requireSessionUser();
  return NextResponse.json(getLeadImportTemplate());
}

export async function POST() {
  await requireSessionUser();
  return NextResponse.json(getLeadImportTemplate(), { status: 501 });
}
