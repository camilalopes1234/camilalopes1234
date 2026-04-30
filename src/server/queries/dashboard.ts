import { EvaluationStatus, LeadStage, LeadTemperature, OpportunityStatus, Prisma, TaskStatus } from "@prisma/client";
import { subDays } from "date-fns";

import { prisma } from "@/server/db/prisma";
import { isDemoMode } from "@/server/demo/mode";
import { getDemoDashboardData } from "@/server/demo/queries";

export async function getDashboardData(user: { id: string; role: "ADMIN" | "SELLER" }) {
  if (isDemoMode) {
    return getDemoDashboardData(user);
  }

  const leadScope: Prisma.LeadWhereInput = user.role === "ADMIN" ? {} : { ownerId: user.id };
  const taskScope: Prisma.TaskWhereInput = user.role === "ADMIN" ? {} : { ownerId: user.id };
  const opportunityScope: Prisma.OpportunityWhereInput = user.role === "ADMIN" ? {} : { ownerId: user.id };
  const evaluationScope: Prisma.EvaluationWhereInput = user.role === "ADMIN" ? {} : { ownerId: user.id };
  const periodStart = subDays(new Date(), 30);

  const [
    totalLeads,
    newLeads,
    leadsByStage,
    hotLeads,
    totalNegotiation,
    totalClosed,
    totalLost,
    valueAgg,
    overdueTasks,
    bySource,
    byOwner,
    closedAgg,
    evaluationsScheduled,
    evaluationsCompleted,
    evaluationNoShow,
    proposalsSent,
    proposalsAccepted
  ] = await Promise.all([
    prisma.lead.count({ where: leadScope }),
    prisma.lead.count({ where: { ...leadScope, createdAt: { gte: periodStart } } }),
    prisma.lead.groupBy({ by: ["stage"], _count: { stage: true }, where: leadScope }),
    prisma.lead.count({ where: { ...leadScope, temperature: LeadTemperature.HOT } }),
    prisma.lead.count({ where: { ...leadScope, stage: LeadStage.NEGOTIATION } }),
    prisma.lead.count({ where: { ...leadScope, status: "WON" } }),
    prisma.lead.count({ where: { ...leadScope, status: "LOST" } }),
    prisma.lead.aggregate({
      where: leadScope,
      _sum: { potentialValue: true }
    }),
    prisma.task.count({
      where: {
        ...taskScope,
        status: TaskStatus.PENDING,
        dueDate: { lt: new Date() }
      }
    }),
    prisma.lead.groupBy({ by: ["sourcePrimary"], _count: { sourcePrimary: true }, where: leadScope }),
    prisma.lead.groupBy({ by: ["ownerId"], _count: { ownerId: true }, where: leadScope }),
    prisma.lead.aggregate({
      where: { ...leadScope, status: "WON" },
      _sum: { closedValue: true }
    }),
    prisma.evaluation.count({ where: { ...evaluationScope, status: { in: [EvaluationStatus.SCHEDULED, EvaluationStatus.CONFIRMED] } } }),
    prisma.evaluation.count({ where: { ...evaluationScope, status: EvaluationStatus.COMPLETED } }),
    prisma.evaluation.count({ where: { ...evaluationScope, status: EvaluationStatus.NO_SHOW } }),
    prisma.opportunity.count({ where: { ...opportunityScope, status: { in: [OpportunityStatus.SENT, OpportunityStatus.NEGOTIATING] } } }),
    prisma.opportunity.count({ where: { ...opportunityScope, status: OpportunityStatus.ACCEPTED } })
  ]);

  const owners = await prisma.user.findMany({
    where: { id: { in: byOwner.map((item) => item.ownerId) } },
    select: { id: true, name: true }
  });

  const conversionRate = totalLeads === 0 ? 0 : (totalClosed / totalLeads) * 100;

  const evaluationAttendanceRate =
    evaluationsScheduled + evaluationsCompleted + evaluationNoShow === 0
      ? 0
      : (evaluationsCompleted / (evaluationsCompleted + evaluationNoShow)) * 100;

  return {
    totalLeads,
    newLeads,
    hotLeads,
    totalNegotiation,
    totalClosed,
    totalLost,
    evaluationsScheduled,
    evaluationsCompleted,
    evaluationNoShow,
    proposalsSent,
    proposalsAccepted,
    evaluationAttendanceRate,
    conversionRate,
    totalPotentialValue: Number(valueAgg._sum.potentialValue ?? 0),
    totalClosedValue: Number(closedAgg._sum.closedValue ?? 0),
    overdueTasks,
    leadsByStage: leadsByStage.map((item) => ({ stage: item.stage, total: item._count.stage })),
    leadsBySource: bySource.map((item) => ({ source: item.sourcePrimary, total: item._count.sourcePrimary })),
    leadsByOwner: byOwner.map((item) => ({
      ownerId: item.ownerId,
      ownerName: owners.find((owner) => owner.id === item.ownerId)?.name ?? "Sem nome",
      total: item._count.ownerId
    }))
  };
}
