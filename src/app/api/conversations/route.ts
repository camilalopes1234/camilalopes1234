import { NextResponse } from "next/server";

import { requireSessionUser } from "@/server/auth/session";
import { getConversations } from "@/server/queries/conversations";

export async function GET() {
  const user = await requireSessionUser();
  const conversations = await getConversations({ id: user.id, role: user.role });
  return NextResponse.json(conversations);
}
