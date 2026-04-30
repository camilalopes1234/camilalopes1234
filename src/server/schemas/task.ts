import { TaskPriority, TaskStatus, TaskType } from "@prisma/client";
import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  dueDate: z.coerce.date(),
  ownerId: z.string().min(1),
  leadId: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.PENDING),
  type: z.nativeEnum(TaskType).default(TaskType.FOLLOW_UP),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM)
});
