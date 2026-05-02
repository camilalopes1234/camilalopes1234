import { auth } from "@/auth";
import { isAdmin } from "@/server/permissions/access";

export async function requireSessionUser() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Não autenticado.");
  }

  return session.user;
}

export async function requireAdminUser() {
  const user = await requireSessionUser();

  if (!isAdmin(user)) {
    throw new Error("Acesso permitido apenas para administradores.");
  }

  return user;
}
