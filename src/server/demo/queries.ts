import { EvaluationStatus, LeadStage, LeadStatus, TaskStatus } from "@prisma/client";
import { endOfDay, startOfDay, subDays } from "date-fns";

import { demoConversations, demoEvaluations, demoInteractions, demoLeads, demoMessages, demoOpportunities, demoTasks, demoUsers } from "@/server/demo/data";

export function getScopedUser(userId: string) {
  return demoUsers.find((user) => user.id === userId) ?? demoUsers[0];
}

export function getScopedLeads(user: { id: string; role: "ADMIN" | "SELLER" }) {
  return user.role === "ADMIN" ? demoLeads : demoLeads.filter((lead) => lead.ownerId === user.id);
}

export function getDemoLeadsForUser(user: { id: string; role: "ADMIN" | "SELLER" }, filters: Record<string, string | undefined> = {}) {
  const leads = getScopedLeads(user);
  const q = filters.q?.toLowerCase();

  return leads
    .filter((lead) => {
      if (filters.stage && lead.stage !== filters.stage) return false;
      if (filters.ownerId && lead.ownerId !== filters.ownerId) return false;
      if (filters.status && lead.status !== filters.status) return false;
      if (filters.temperature && lead.temperature !== filters.temperature) return false;
      if (filters.source && !lead.source.toLowerCase().includes(filters.source.toLowerCase())) return false;
      if (!q) return true;

      return [lead.fullName, lead.phone, lead.email, lead.instagram, lead.company]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    })
    .map((lead) => ({
      ...lead,
      owner: {
        id: lead.ownerId,
        name: demoUsers.find((userItem) => userItem.id === lead.ownerId)?.name ?? "Sem nome"
      },
      interactions: demoInteractions.filter((interaction) => interaction.leadId === lead.id).slice(0, 1),
      conversations: demoConversations
        .filter((conversation) => conversation.leadId === lead.id)
        .slice(0, 1)
        .map((conversation) => ({
          ...conversation,
          messages: demoMessages.filter((message) => message.conversationId === conversation.id).slice(0, 1)
        })),
      tasks: demoTasks.filter((task) => task.leadId === lead.id && task.status === TaskStatus.PENDING).slice(0, 1)
    }));
}

export function getDemoLeadDetail(user: { id: string; role: "ADMIN" | "SELLER" }, id: string) {
  const lead = getScopedLeads(user).find((item) => item.id === id);
  if (!lead) return null;

  return {
    ...lead,
    owner: { name: demoUsers.find((userItem) => userItem.id === lead.ownerId)?.name ?? "Sem nome" },
    interactions: demoInteractions
      .filter((item) => item.leadId === id)
      .map((item) => ({
        ...item,
        user: { name: demoUsers.find((userItem) => userItem.id === item.userId)?.name ?? "Sem nome" }
      })),
    opportunities: demoOpportunities
      .filter((item) => item.leadId === id)
      .map((item) => ({
        ...item,
        owner: { name: demoUsers.find((userItem) => userItem.id === item.ownerId)?.name ?? "Sem nome" }
      })),
    tasks: demoTasks
      .filter((item) => item.leadId === id)
      .map((item) => ({
        ...item,
        owner: { name: demoUsers.find((userItem) => userItem.id === item.ownerId)?.name ?? "Sem nome" }
      })),
    evaluations: demoEvaluations
      .filter((item) => item.leadId === id)
      .map((item) => ({
        ...item,
        owner: { name: demoUsers.find((userItem) => userItem.id === item.ownerId)?.name ?? "Sem nome" }
      })),
    activityLogs: []
  };
}

export function getDemoDashboardData(user: { id: string; role: "ADMIN" | "SELLER" }) {
  const leads = getScopedLeads(user);
  const opportunities = user.role === "ADMIN" ? demoOpportunities : demoOpportunities.filter((item) => item.ownerId === user.id);
  const evaluations = user.role === "ADMIN" ? demoEvaluations : demoEvaluations.filter((item) => item.ownerId === user.id);
  const tasks = user.role === "ADMIN" ? demoTasks : demoTasks.filter((item) => item.ownerId === user.id);
  const periodStart = subDays(new Date(), 30);

  const totalLeads = leads.length;
  const newLeads = leads.filter((lead) => lead.createdAt >= periodStart).length;
  const hotLeads = leads.filter((lead) => lead.temperature === "HOT").length;
  const totalNegotiation = leads.filter((lead) => lead.stage === LeadStage.NEGOTIATION).length;
  const totalClosed = leads.filter((lead) => lead.status === LeadStatus.WON).length;
  const totalLost = leads.filter((lead) => lead.status === LeadStatus.LOST).length;
  const totalPotentialValue = leads.reduce((sum, lead) => sum + Number(lead.potentialValue ?? 0), 0);
  const totalClosedValue = leads.reduce((sum, lead) => sum + Number(lead.closedValue ?? 0), 0);
  const overdueTasks = tasks.filter((task) => task.status === TaskStatus.OVERDUE || (task.status === TaskStatus.PENDING && task.dueDate < new Date())).length;
  const evaluationsScheduled = evaluations.filter((evaluation) => ["SCHEDULED", "CONFIRMED"].includes(evaluation.status)).length;
  const evaluationsCompleted = evaluations.filter((evaluation) => evaluation.status === EvaluationStatus.COMPLETED).length;
  const evaluationNoShow = evaluations.filter((evaluation) => evaluation.status === EvaluationStatus.NO_SHOW).length;
  const proposalsSent = opportunities.filter((item) => ["SENT", "NEGOTIATING"].includes(item.status)).length;
  const proposalsAccepted = opportunities.filter((item) => item.status === "ACCEPTED").length;

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
    evaluationAttendanceRate: evaluationsCompleted + evaluationNoShow === 0 ? 0 : (evaluationsCompleted / (evaluationsCompleted + evaluationNoShow)) * 100,
    conversionRate: totalLeads === 0 ? 0 : (totalClosed / totalLeads) * 100,
    totalPotentialValue,
    totalClosedValue,
    overdueTasks,
    leadsByStage: Object.values(LeadStage).map((stage) => ({ stage, total: leads.filter((lead) => lead.stage === stage).length })),
    leadsBySource: Object.values(["INSTAGRAM", "WHATSAPP", "INDICATION", "PAID_TRAFFIC", "WEBSITE", "EVENT", "OTHER"]).map((source) => ({
      source: source as never,
      total: leads.filter((lead) => lead.sourcePrimary === source).length
    })),
    leadsByOwner: demoUsers
      .filter((userItem) => user.role === "ADMIN" || userItem.id === user.id)
      .map((userItem) => ({
        ownerId: userItem.id,
        ownerName: userItem.name,
        total: leads.filter((lead) => lead.ownerId === userItem.id).length
      }))
  };
}

export function getDemoAgendaData(user: { id: string; role: "ADMIN" | "SELLER" }) {
  const tasks = user.role === "ADMIN" ? demoTasks : demoTasks.filter((item) => item.ownerId === user.id);
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const enrich = (task: (typeof demoTasks)[number]) => ({
    ...task,
    lead: demoLeads.find((lead) => lead.id === task.leadId) ? { fullName: demoLeads.find((lead) => lead.id === task.leadId)!.fullName } : null,
    owner: { name: demoUsers.find((userItem) => userItem.id === task.ownerId)?.name ?? "Sem nome" }
  });

  return {
    overdue: tasks.filter((task) => task.dueDate < todayStart).map(enrich),
    today: tasks.filter((task) => task.dueDate >= todayStart && task.dueDate <= todayEnd).map(enrich),
    upcoming: tasks.filter((task) => task.dueDate > todayEnd).map(enrich)
  };
}

export function getDemoOpportunities(user: { id: string; role: "ADMIN" | "SELLER" }) {
  const items = user.role === "ADMIN" ? demoOpportunities : demoOpportunities.filter((item) => item.ownerId === user.id);
  return items.map((item) => ({
    ...item,
    lead: { fullName: demoLeads.find((lead) => lead.id === item.leadId)?.fullName ?? "Lead" },
    owner: { name: demoUsers.find((userItem) => userItem.id === item.ownerId)?.name ?? "Sem nome" }
  }));
}

export function getDemoEvaluations(user: { id: string; role: "ADMIN" | "SELLER" }) {
  const items = user.role === "ADMIN" ? demoEvaluations : demoEvaluations.filter((item) => item.ownerId === user.id);
  const enrich = (item: (typeof demoEvaluations)[number]) => ({
    ...item,
    lead: { fullName: demoLeads.find((lead) => lead.id === item.leadId)?.fullName ?? "Lead" },
    owner: { name: demoUsers.find((userItem) => userItem.id === item.ownerId)?.name ?? "Sem nome" }
  });
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  return {
    today: items.filter((item) => item.scheduledAt >= todayStart && item.scheduledAt <= todayEnd).map(enrich),
    upcoming: items.filter((item) => item.scheduledAt > todayEnd).map(enrich),
    noShow: items.filter((item) => item.status === EvaluationStatus.NO_SHOW).map(enrich),
    completed: items.filter((item) => item.status === EvaluationStatus.COMPLETED).map(enrich)
  };
}
