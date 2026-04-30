import { TaskStatus } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";

import { prisma } from "@/server/db/prisma";
import { isDemoMode } from "@/server/demo/mode";
import { getDemoAgendaData } from "@/server/demo/queries";

export async function getAgendaData(user: { id: string; role: "ADMIN" | "SELLER" }) {
  if (isDemoMode) {
    return getDemoAgendaData(user);
  }

  const scope = user.role === "ADMIN" ? {} : { ownerId: user.id };
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [overdue, today, upcoming] = await Promise.all([
    prisma.task.findMany({
      where: { ...scope, status: TaskStatus.PENDING, dueDate: { lt: todayStart } },
      include: { lead: true, owner: true },
      orderBy: { dueDate: "asc" }
    }),
    prisma.task.findMany({
      where: { ...scope, status: TaskStatus.PENDING, dueDate: { gte: todayStart, lte: todayEnd } },
      include: { lead: true, owner: true },
      orderBy: { dueDate: "asc" }
    }),
    prisma.task.findMany({
      where: { ...scope, status: TaskStatus.PENDING, dueDate: { gt: todayEnd } },
      include: { lead: true, owner: true },
      orderBy: { dueDate: "asc" },
      take: 20
    })
  ]);

  return { overdue, today, upcoming };
}
