import { UserRole } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { demoLeads, demoTasks, demoUsers } from "@/server/demo/data";
import { isDemoMode } from "@/server/demo/mode";

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    leads: number;
    tasks: number;
    opportunities: number;
  };
};

export async function getManageableUsers(): Promise<UserListItem[]> {
  if (isDemoMode) {
    return demoUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title ?? null,
      isActive: user.isActive,
      createdAt: new Date(),
      _count: {
        leads: demoLeads.filter((lead) => lead.ownerId === user.id).length,
        tasks: demoTasks.filter((task) => task.ownerId === user.id).length,
        opportunities: 0
      }
    }));
  }

  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      title: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          leads: true,
          tasks: true,
          opportunities: true
        }
      }
    },
    orderBy: [{ role: "asc" }, { name: "asc" }]
  });
}
