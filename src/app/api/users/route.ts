import { NextResponse } from "next/server";

import { requireAdminUser } from "@/server/auth/session";
import { getManageableUsers } from "@/server/queries/users";
import { createUserSchema } from "@/server/schemas/user";
import { createUser } from "@/server/services/user-service";

function normalizeCreatePayload(payload: Record<string, unknown>) {
  return {
    ...payload,
    title: payload.title || null,
    isActive: payload.isActive === "true" || payload.isActive === true
  };
}

export async function GET() {
  try {
    await requireAdminUser();
    const users = await getManageableUsers();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const actingUser = await requireAdminUser();
    const payload = normalizeCreatePayload((await request.json()) as Record<string, unknown>);
    const parsed = createUserSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados invalidos." }, { status: 400 });
    }

    const user = await createUser(parsed.data, actingUser);
    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
