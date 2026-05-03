import {
  LeadSourcePrimary,
  LeadStage,
  LeadTemperature,
  WhatsAppCampaignSendMode
} from "@prisma/client";
import { z } from "zod";

export const campaignSchema = z
  .object({
    title: z.string().min(3, "Informe o nome da campanha."),
    description: z.string().optional().nullable(),
    sendMode: z.nativeEnum(WhatsAppCampaignSendMode).default(WhatsAppCampaignSendMode.TEXT),
    messageBody: z.string().min(8, "Escreva a mensagem ou template base da campanha."),
    templateId: z.string().optional().nullable(),
    audienceSearch: z.string().optional().nullable(),
    filterStage: z.nativeEnum(LeadStage).optional().nullable(),
    filterSourcePrimary: z.nativeEnum(LeadSourcePrimary).optional().nullable(),
    filterTemperature: z.nativeEnum(LeadTemperature).optional().nullable(),
    filterOwnerId: z.string().optional().nullable(),
    filterCity: z.string().optional().nullable(),
    requiresOptIn: z.coerce.boolean().default(false),
    scheduledAt: z.coerce.date().optional().nullable()
  })
  .superRefine((value, context) => {
    if (value.sendMode === WhatsAppCampaignSendMode.TEMPLATE && !value.templateId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione um template oficial para campanha em massa.",
        path: ["templateId"]
      });
    }
  });
