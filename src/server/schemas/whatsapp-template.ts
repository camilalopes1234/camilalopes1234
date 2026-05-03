import { WhatsAppTemplateCategory } from "@prisma/client";
import { z } from "zod";

export const whatsappTemplateSchema = z.object({
  name: z
    .string()
    .min(3, "Informe o nome tecnico do template.")
    .regex(/^[a-z0-9_]+$/, "Use apenas letras minusculas, numeros e underscore no nome tecnico."),
  displayName: z.string().min(3, "Informe o nome exibido."),
  category: z.nativeEnum(WhatsAppTemplateCategory).default(WhatsAppTemplateCategory.MARKETING),
  languageCode: z.string().min(2, "Informe o idioma."),
  bodyText: z.string().min(10, "Escreva o corpo base do template."),
  variableKeys: z.string().optional().nullable(),
  isApproved: z.coerce.boolean().default(false)
});
