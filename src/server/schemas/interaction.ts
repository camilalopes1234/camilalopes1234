import { InteractionType } from "@prisma/client";
import { z } from "zod";

export const interactionSchema = z.object({
  type: z.nativeEnum(InteractionType),
  occurredAt: z.coerce.date(),
  content: z.string().min(4, "Descreva a interação."),
  nextActionAt: z.coerce.date().optional().nullable(),
  generateTask: z.coerce.boolean().optional().nullable()
});
