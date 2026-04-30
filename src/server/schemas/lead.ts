import { InvestmentRange, LeadSourcePrimary, LeadStage, LeadStatus, LeadTemperature, LeadUrgency } from "@prisma/client";
import { z } from "zod";

export const leadSchema = z.object({
  fullName: z.string().min(3, "Informe o nome completo."),
  phone: z.string().min(8, "Informe um telefone válido."),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email("Informe um email válido.").optional().or(z.literal("")).nullable(),
  instagram: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  sourcePrimary: z.nativeEnum(LeadSourcePrimary).default(LeadSourcePrimary.INSTAGRAM),
  sourceDetail: z.string().optional().nullable(),
  source: z.string().min(2, "Informe a origem do lead."),
  mainInterest: z.string().optional().nullable(),
  investmentRange: z.nativeEnum(InvestmentRange).default(InvestmentRange.UNDEFINED),
  urgency: z.nativeEnum(LeadUrgency).default(LeadUrgency.MEDIUM),
  notes: z.string().optional().nullable(),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.ACTIVE),
  stage: z.nativeEnum(LeadStage).default(LeadStage.NEW),
  temperature: z.nativeEnum(LeadTemperature).default(LeadTemperature.WARM),
  ownerId: z.string().min(1, "Selecione o responsável."),
  potentialValue: z.coerce.number().min(0).optional().nullable(),
  closedValue: z.coerce.number().min(0).optional().nullable(),
  attendedEvaluation: z.coerce.boolean().optional().nullable(),
  closedAtEvaluation: z.coerce.boolean().optional().nullable(),
  whatsappTemplate: z.string().optional().nullable(),
  nextActionAt: z.coerce.date().optional().nullable(),
  lossReason: z.string().optional().nullable()
});

export const leadStageSchema = z.object({
  stage: z.nativeEnum(LeadStage),
  closedValue: z.coerce.number().min(0).optional().nullable(),
  lossReason: z.string().optional().nullable()
});
