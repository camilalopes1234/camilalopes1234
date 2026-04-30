import { OpportunityStatus } from "@prisma/client";
import { z } from "zod";

export const opportunitySchema = z.object({
  title: z.string().min(3, "Informe um título."),
  leadId: z.string().min(1),
  ownerId: z.string().min(1),
  estimatedValue: z.coerce.number().min(0).optional().nullable(),
  finalValue: z.coerce.number().min(0).optional().nullable(),
  status: z.nativeEnum(OpportunityStatus).default(OpportunityStatus.DRAFT),
  sentAt: z.coerce.date().optional().nullable(),
  returnAt: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable()
});
