import {
  LeadSourcePrimary,
  LeadStage,
  LeadTemperature,
  MessageType,
  WhatsAppCampaignSendMode
} from "@prisma/client";
import { z } from "zod";

export const campaignSchema = z
  .object({
    title: z.string().min(3, "Informe o nome da campanha."),
    description: z.string().optional().nullable(),
    sendMode: z.nativeEnum(WhatsAppCampaignSendMode).default(WhatsAppCampaignSendMode.TEXT),
    messageType: z.nativeEnum(MessageType).default(MessageType.TEXT),
    messageBody: z.string().optional().nullable(),
    mediaUrl: z.string().url("Informe uma URL publica valida para a midia.").optional().nullable().or(z.literal("")),
    mimeType: z.string().optional().nullable(),
    mediaCaption: z.string().optional().nullable(),
    mediaFileName: z.string().optional().nullable(),
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

    if (value.sendMode === WhatsAppCampaignSendMode.TEXT && value.messageType === MessageType.TEXT && !value.messageBody?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Escreva a mensagem base da campanha.",
        path: ["messageBody"]
      });
    }

    if (
      value.sendMode === WhatsAppCampaignSendMode.TEXT &&
      (value.messageType === MessageType.IMAGE || value.messageType === MessageType.VIDEO || value.messageType === MessageType.AUDIO) &&
      !value.mediaUrl
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a URL publica da midia para a campanha.",
        path: ["mediaUrl"]
      });
    }
  });
