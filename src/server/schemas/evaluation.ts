import { EvaluationStatus } from "@prisma/client";
import { z } from "zod";

export const evaluationSchema = z.object({
  scheduledAt: z.coerce.date(),
  status: z.nativeEnum(EvaluationStatus).default(EvaluationStatus.SCHEDULED),
  attended: z.coerce.boolean().optional().nullable(),
  preNotes: z.string().optional().nullable(),
  postNotes: z.string().optional().nullable(),
  leadId: z.string().min(1),
  ownerId: z.string().min(1)
});
