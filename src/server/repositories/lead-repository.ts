import { LeadStatus, LeadTemperature, Prisma, type LeadStage } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

export type LeadFilters = {
  q?: string;
  stage?: LeadStage;
  source?: string;
  ownerId?: string;
  city?: string;
  temperature?: LeadTemperature;
  status?: LeadStatus;
};

export function buildLeadWhere(filters: LeadFilters = {}, scopedOwnerId?: string, isAdmin?: boolean): Prisma.LeadWhereInput {
  const search = filters.q?.trim();

  return {
    ownerId: !isAdmin ? scopedOwnerId : filters.ownerId || undefined,
    stage: filters.stage,
    source: filters.source,
    city: filters.city,
    temperature: filters.temperature ? { equals: filters.temperature } : undefined,
    status: filters.status ? { equals: filters.status } : undefined,
    OR: search
      ? [
          { fullName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { instagram: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } }
        ]
      : undefined
  };
}

export async function findManyLeads(where: Prisma.LeadWhereInput) {
  return prisma.lead.findMany({
    where,
    include: {
      owner: true,
      interactions: {
        orderBy: { occurredAt: "asc" },
        take: 1
      },
      conversations: {
        orderBy: { createdAt: "asc" },
        take: 1,
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 1
          }
        }
      },
      tasks: {
        where: { status: "PENDING" },
        orderBy: { dueDate: "asc" },
        take: 1
      }
    },
    orderBy: [{ nextActionAt: "asc" }, { createdAt: "desc" }]
  });
}

export async function findLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      owner: true,
      interactions: {
        include: { user: true },
        orderBy: { occurredAt: "desc" }
      },
      opportunities: {
        include: { owner: true },
        orderBy: { createdAt: "desc" }
      },
      tasks: {
        include: { owner: true },
        orderBy: { dueDate: "asc" }
      },
      evaluations: {
        include: { owner: true },
        orderBy: { scheduledAt: "desc" }
      },
      activityLogs: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 20
      }
    }
  });
}
