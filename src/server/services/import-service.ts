import { ActivityEntity, LeadSourcePrimary, Prisma, type UserRole } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { createActivityLog } from "@/server/services/activity-log-service";

export type LeadImportField =
  | "ignore"
  | "fullName"
  | "phone"
  | "whatsapp"
  | "email"
  | "instagram"
  | "city"
  | "state"
  | "company"
  | "sourcePrimary"
  | "sourceDetail"
  | "mainInterest"
  | "potentialValue"
  | "ownerId";

export const leadImportFieldMap: Array<{ value: LeadImportField; label: string }> = [
  { value: "ignore", label: "Ignorar coluna" },
  { value: "fullName", label: "Nome completo" },
  { value: "phone", label: "Telefone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "instagram", label: "Instagram" },
  { value: "city", label: "Cidade" },
  { value: "state", label: "Estado" },
  { value: "company", label: "Empresa" },
  { value: "sourcePrimary", label: "Origem principal" },
  { value: "sourceDetail", label: "Origem detalhada" },
  { value: "mainInterest", label: "Interesse principal" },
  { value: "potentialValue", label: "Valor potencial" },
  { value: "ownerId", label: "Responsavel" }
];

type ImportActor = {
  id: string;
  role: UserRole;
};

type ImportRow = Record<string, string>;
export type ImportMapping = Record<string, LeadImportField>;

type ImportOptions = {
  rows: ImportRow[];
  mapping: ImportMapping;
  defaultOwnerId?: string | null;
  updateExisting?: boolean;
  actor: ImportActor;
};

function normalizeDigits(value?: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length ? digits : null;
}

function normalizeEmail(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseCurrency(value?: string | null) {
  if (!value) return null;
  const normalized = value
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSourcePrimary(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return LeadSourcePrimary.OTHER;

  if (["instagram", "insta", "ig"].includes(normalized)) return LeadSourcePrimary.INSTAGRAM;
  if (["whatsapp", "wpp", "wa"].includes(normalized)) return LeadSourcePrimary.WHATSAPP;
  if (["indicacao", "indicação", "indicado"].includes(normalized)) return LeadSourcePrimary.INDICATION;
  if (["trafego_pago", "tráfego pago", "trafego pago", "meta ads", "google ads", "ads"].includes(normalized)) {
    return LeadSourcePrimary.PAID_TRAFFIC;
  }
  if (["site", "website"].includes(normalized)) return LeadSourcePrimary.WEBSITE;
  if (["evento", "event"].includes(normalized)) return LeadSourcePrimary.EVENT;
  return LeadSourcePrimary.OTHER;
}

function extractField(row: ImportRow, mapping: ImportMapping, targetField: LeadImportField) {
  const entry = Object.entries(mapping).find(([, field]) => field === targetField);
  if (!entry) return null;
  const [column] = entry;
  return row[column] ?? null;
}

function buildLeadPayload(row: ImportRow, mapping: ImportMapping, defaultOwnerId: string, actor: ImportActor) {
  const fullName = normalizeText(extractField(row, mapping, "fullName"));
  const phone = normalizeText(extractField(row, mapping, "phone"));
  const whatsapp = normalizeDigits(extractField(row, mapping, "whatsapp")) || normalizeDigits(phone);
  const email = normalizeEmail(extractField(row, mapping, "email"));
  const ownerId = actor.role === "ADMIN" ? normalizeText(extractField(row, mapping, "ownerId")) || defaultOwnerId : actor.id;

  return {
    fullName,
    phone: normalizeText(phone) || whatsapp || "",
    whatsapp,
    email,
    instagram: normalizeText(extractField(row, mapping, "instagram")),
    city: normalizeText(extractField(row, mapping, "city")),
    state: normalizeText(extractField(row, mapping, "state")),
    company: normalizeText(extractField(row, mapping, "company")),
    sourcePrimary: normalizeSourcePrimary(extractField(row, mapping, "sourcePrimary")),
    sourceDetail: normalizeText(extractField(row, mapping, "sourceDetail")),
    source:
      normalizeText(extractField(row, mapping, "sourceDetail")) ||
      normalizeText(extractField(row, mapping, "sourcePrimary")) ||
      "Importacao CSV",
    mainInterest: normalizeText(extractField(row, mapping, "mainInterest")),
    potentialValue: parseCurrency(extractField(row, mapping, "potentialValue")),
    ownerId
  };
}

async function findExistingLead(payload: ReturnType<typeof buildLeadPayload>) {
  const orConditions: Prisma.LeadWhereInput[] = [];

  if (payload.whatsapp) {
    orConditions.push({ whatsapp: payload.whatsapp });
    orConditions.push({ phone: payload.whatsapp });
  }

  if (payload.phone) {
    orConditions.push({ phone: payload.phone });
  }

  if (payload.email) {
    orConditions.push({ email: payload.email });
  }

  if (orConditions.length === 0) return null;

  return prisma.lead.findFirst({
    where: {
      OR: orConditions
    }
  });
}

export async function importLeadsFromRows(options: ImportOptions) {
  const summary = {
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[]
  };

  const defaultOwnerId = options.actor.role === "ADMIN" ? normalizeText(options.defaultOwnerId) : options.actor.id;

  if (!defaultOwnerId) {
    throw new Error("Selecione um responsavel padrao para importar os contatos.");
  }

  for (const [index, row] of options.rows.entries()) {
    summary.processed += 1;

    const payload = buildLeadPayload(row, options.mapping, defaultOwnerId, options.actor);

    if (!payload.fullName || !payload.phone || !payload.ownerId) {
      summary.skipped += 1;
      summary.errors.push(`Linha ${index + 2}: faltam nome, telefone ou responsavel.`);
      continue;
    }

    try {
      const existingLead = await findExistingLead(payload);

      if (existingLead && !options.updateExisting) {
        summary.skipped += 1;
        summary.errors.push(`Linha ${index + 2}: lead ja existente e atualizacao desativada.`);
        continue;
      }

      if (existingLead) {
        await prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            fullName: payload.fullName,
            phone: payload.phone,
            whatsapp: payload.whatsapp,
            email: payload.email,
            instagram: payload.instagram,
            city: payload.city,
            state: payload.state,
            company: payload.company,
            sourcePrimary: payload.sourcePrimary,
            sourceDetail: payload.sourceDetail,
            source: payload.source,
            mainInterest: payload.mainInterest,
            potentialValue: payload.potentialValue,
            ownerId: payload.ownerId
          }
        });

        await createActivityLog({
          userId: options.actor.id,
          entityType: ActivityEntity.LEAD,
          entityId: existingLead.id,
          action: "lead.import.updated",
          message: `Lead ${payload.fullName} atualizado via importacao CSV.`,
          leadId: existingLead.id
        });

        summary.updated += 1;
        continue;
      }

      const lead = await prisma.lead.create({
        data: {
          fullName: payload.fullName,
          phone: payload.phone,
          whatsapp: payload.whatsapp,
          email: payload.email,
          instagram: payload.instagram,
          city: payload.city,
          state: payload.state,
          company: payload.company,
          sourcePrimary: payload.sourcePrimary,
          sourceDetail: payload.sourceDetail,
          source: payload.source,
          mainInterest: payload.mainInterest,
          potentialValue: payload.potentialValue,
          ownerId: payload.ownerId
        }
      });

      await createActivityLog({
        userId: options.actor.id,
        entityType: ActivityEntity.LEAD,
        entityId: lead.id,
        action: "lead.import.created",
        message: `Lead ${lead.fullName} criado via importacao CSV.`,
        leadId: lead.id
      });

      summary.created += 1;
    } catch (error) {
      summary.skipped += 1;
      summary.errors.push(`Linha ${index + 2}: ${error instanceof Error ? error.message : "falha ao importar."}`);
    }
  }

  return summary;
}

export function getLeadImportTemplate() {
  return {
    status: "ready",
    message: "Importacao CSV habilitada.",
    expectedFields: leadImportFieldMap
  };
}
