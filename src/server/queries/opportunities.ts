import { prisma } from "@/server/db/prisma";
import { isDemoMode } from "@/server/demo/mode";
import { getDemoOpportunities } from "@/server/demo/queries";

export async function getOpportunities(user: { id: string; role: "ADMIN" | "SELLER" }) {
  if (isDemoMode) {
    return getDemoOpportunities(user);
  }

  return prisma.opportunity.findMany({
    where: user.role === "ADMIN" ? {} : { ownerId: user.id },
    include: {
      lead: true,
      owner: true
    },
    orderBy: { createdAt: "desc" }
  });
}
