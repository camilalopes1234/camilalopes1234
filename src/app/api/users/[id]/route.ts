import { NextResponse } from "next/server";

import { requireAdminUser } from "@/server/auth/session";
import { updateUserSchema } from "@/server/schemas/user";
import { updateUser } from "@/server/services/user-service";

function normalizeUpdatePayload(payload: Record<string, unknown>) {
  return {
    ...payload,
    title: payload.title || null,
    password: payload.password || undefined,
    isActive: payload.isActive === "true" || payload.isActive === true
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actingUser = await requireAdminUser();
    const { id } = await params;
    const payload = normalizeUpdatePayload((await request.json()) as Record<string, unknown>);
    const parsed = updateUserSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados invalidos." }, { status: 400 });
    }

    await updateUser(id, parsed.data, actingUser);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
