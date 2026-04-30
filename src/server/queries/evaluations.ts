import { EvaluationStatus } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";

import { prisma } from "@/server/db/prisma";
import { isDemoMode } from "@/server/demo/mode";
import { getDemoEvaluations } from "@/server/demo/queries";

export async function getEvaluationsData(user: { id: string; role: "ADMIN" | "SELLER" }) {
  if (isDemoMode) {
    return getDemoEvaluations(user);
  }

  const scope = user.role === "ADMIN" ? {} : { ownerId: user.id };
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [today, upcoming, noShow, completed] = await Promise.all([
    prisma.evaluation.findMany({
      where: { ...scope, scheduledAt: { gte: todayStart, lte: todayEnd } },
      include: { lead: true, owner: true },
      orderBy: { scheduledAt: "asc" }
    }),
    prisma.evaluation.findMany({
      where: { ...scope, scheduledAt: { gt: todayEnd }, status: { in: [EvaluationStatus.SCHEDULED, EvaluationStatus.CONFIRMED] } },
      include: { lead: true, owner: true },
      orderBy: { scheduledAt: "asc" }
    }),
    prisma.evaluation.findMany({
      where: { ...scope, status: EvaluationStatus.NO_SHOW },
      include: { lead: true, owner: true },
      orderBy: { scheduledAt: "desc" }
    }),
    prisma.evaluation.findMany({
      where: { ...scope, status: EvaluationStatus.COMPLETED },
      include: { lead: true, owner: true },
      orderBy: { scheduledAt: "desc" },
      take: 20
    })
  ]);

  return { today, upcoming, noShow, completed };
}
