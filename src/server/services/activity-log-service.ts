import { ActivityEntity, Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type CreateLogInput = {
  userId: string;
  entityType: ActivityEntity;
  entityId: string;
  action: string;
  message: string;
  leadId?: string;
  taskId?: string;
  opportunityId?: string;
  evaluationId?: string;
  conversationId?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function createActivityLog(input: CreateLogInput) {
  return prisma.activityLog.create({
    data: input
  });
}
