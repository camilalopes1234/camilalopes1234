import { getDemoLeadDetail, getDemoLeadsForUser } from "@/server/demo/queries";
import { isDemoMode } from "@/server/demo/mode";
import { findLeadById, findManyLeads, buildLeadWhere, type LeadFilters } from "@/server/repositories/lead-repository";

export async function getLeadsForUser(user: { id: string; role: "ADMIN" | "SELLER" }, filters: LeadFilters = {}) {
  if (isDemoMode) {
    return getDemoLeadsForUser(user, filters as Record<string, string | undefined>);
  }

  const where = buildLeadWhere(filters, user.id, user.role === "ADMIN");
  return findManyLeads(where);
}

export async function getLeadForUser(user: { id: string; role: "ADMIN" | "SELLER" }, id: string) {
  if (isDemoMode) {
    return getDemoLeadDetail(user, id);
  }

  const lead = await findLeadById(id);

  if (!lead) return null;
  if (user.role !== "ADMIN" && lead.ownerId !== user.id) return null;

  return lead;
}
