import { TaskStatus, TaskType } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

export async function syncLeadFollowUpTask(input: {
  leadId: string;
  ownerId: string;
  dueDate?: Date | null;
  title?: string;
}) {
  const existing = await prisma.task.findFirst({
    where: {
      leadId: input.leadId,
      type: TaskType.FOLLOW_UP,
      status: TaskStatus.PENDING
    }
  });

  if (!input.dueDate) {
    if (existing) {
      await prisma.task.update({
        where: { id: existing.id },
        data: { status: TaskStatus.COMPLETED, completedAt: new Date() }
      });
    }
    return null;
  }

  if (existing) {
    return prisma.task.update({
      where: { id: existing.id },
      data: {
        dueDate: input.dueDate,
        title: input.title ?? existing.title
      }
    });
  }

  return prisma.task.create({
    data: {
      leadId: input.leadId,
      ownerId: input.ownerId,
      dueDate: input.dueDate,
      title: input.title ?? "Realizar follow-up",
      type: TaskType.FOLLOW_UP
    }
  });
}
