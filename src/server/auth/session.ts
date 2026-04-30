import { auth } from "@/auth";

export async function requireSessionUser() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Não autenticado.");
  }

  return session.user;
}
