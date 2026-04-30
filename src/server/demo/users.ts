import { demoUsers } from "@/server/demo/data";
import { isDemoMode } from "@/server/demo/mode";
import { prisma } from "@/server/db/prisma";

export async function getAssignableUsers(user: { id: string; role: "ADMIN" | "SELLER" }) {
  if (isDemoMode) {
    return demoUsers
      .filter((item) => user.role === "ADMIN" || item.id === user.id)
      .map((item) => ({ id: item.id, name: item.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return prisma.user.findMany({
    where: user.role === "ADMIN" ? {} : { id: user.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });
}
