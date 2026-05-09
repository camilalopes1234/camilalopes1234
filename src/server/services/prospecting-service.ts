import { ActivityEntity, LeadSourcePrimary, LeadTemperature, LeadUrgency, type UserRole } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { demoLeads } from "@/server/demo/data";
import { isDemoMode } from "@/server/demo/mode";
import { createLead, updateLead } from "@/server/services/lead-service";
import { prospectingSearchSchema, type ProspectImportInput, type ProspectingSearchInput } from "@/server/schemas/prospecting";
import { normalizeWhatsappNumber } from "@/server/services/whatsapp-service";
import { createActivityLog } from "@/server/services/activity-log-service";

type ProspectingActor = {
  id: string;
  role: UserRole;
};

export type ProspectingMode = "live" | "simulation";

export type ProspectRecord = {
  id: string;
  provider: "GOOGLE_PLACES";
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  region: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  rating: number | null;
  reviewCount: number | null;
  sourceLabel: string;
  duplicateLeadId: string | null;
  duplicateLeadName: string | null;
  qualityScore: number;
};

type ProspectSearchResponse = {
  provider: "GOOGLE_PLACES";
  mode: ProspectingMode;
  providerLabel: string;
  message: string;
  searchedAt: string;
  queryLabel: string;
  results: ProspectRecord[];
};

const providerLabel = "Google Places";

function getGoogleMapsApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || null;
}

export function isGooglePlacesConfigured() {
  return Boolean(getGoogleMapsApiKey());
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(" ");
}

function buildQueryLabel(input: ProspectingSearchInput) {
  return [input.category, input.keyword, input.region, input.city, input.state, "Brasil"].filter(Boolean).join(" | ");
}

function buildTextQuery(input: ProspectingSearchInput) {
  return [input.keyword, input.category, input.region, input.city, input.state, "Brasil"].filter(Boolean).join(", ");
}

function scoreProspect(candidate: Pick<ProspectRecord, "phone" | "website" | "address" | "rating" | "reviewCount">) {
  let score = 42;
  if (candidate.phone) score += 22;
  if (candidate.website) score += 16;
  if (candidate.address) score += 10;
  if (candidate.rating && candidate.rating >= 4) score += 6;
  if (candidate.reviewCount && candidate.reviewCount >= 10) score += 4;
  return Math.min(100, score);
}

async function findDuplicateLead(candidate: {
  phone?: string | null;
  whatsapp?: string | null;
  name: string;
  city?: string | null;
}) {
  if (isDemoMode) {
    const found = demoLeads.find((lead) => {
      const normalizedPhone = normalizeWhatsappNumber(candidate.phone);
      const normalizedWhatsapp = normalizeWhatsappNumber(candidate.whatsapp);
      return (
        (normalizedPhone && [lead.phone, lead.whatsapp].map(normalizeWhatsappNumber).includes(normalizedPhone)) ||
        (normalizedWhatsapp && [lead.phone, lead.whatsapp].map(normalizeWhatsappNumber).includes(normalizedWhatsapp)) ||
        (lead.fullName.toLowerCase() === candidate.name.toLowerCase() &&
          (candidate.city ? (lead.city || "").toLowerCase() === candidate.city.toLowerCase() : true))
      );
    });

    return found ? { id: found.id, fullName: found.fullName } : null;
  }

  const normalizedPhone = normalizeWhatsappNumber(candidate.phone);
  const normalizedWhatsapp = normalizeWhatsappNumber(candidate.whatsapp);
  const orFilters: Array<Record<string, string>> = [];

  if (normalizedPhone) {
    orFilters.push({ phone: normalizedPhone });
    orFilters.push({ whatsapp: normalizedPhone });
  }

  if (normalizedWhatsapp) {
    orFilters.push({ phone: normalizedWhatsapp });
    orFilters.push({ whatsapp: normalizedWhatsapp });
  }

  if (candidate.name) {
    orFilters.push({ fullName: candidate.name });
  }

  if (orFilters.length === 0) {
    return null;
  }

  const lead = await prisma.lead.findFirst({
    where: {
      OR: orFilters.map((filter) =>
        filter.fullName
          ? {
              fullName: filter.fullName,
              city: candidate.city || undefined
            }
          : filter
      )
    },
    select: { id: true, fullName: true }
  });

  return lead;
}

async function enrichWithDuplicates(records: Omit<ProspectRecord, "duplicateLeadId" | "duplicateLeadName" | "qualityScore">[]) {
  const enriched: ProspectRecord[] = [];

  for (const record of records) {
    const duplicate = await findDuplicateLead({
      name: record.name,
      city: record.city,
      phone: record.phone,
      whatsapp: record.whatsapp
    });

    enriched.push({
      ...record,
      duplicateLeadId: duplicate?.id ?? null,
      duplicateLeadName: duplicate?.fullName ?? null,
      qualityScore: scoreProspect(record)
    });
  }

  return enriched;
}

async function searchGooglePlacesLive(input: ProspectingSearchInput) {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.primaryTypeDisplayName"
    },
    body: JSON.stringify({
      textQuery: buildTextQuery(input),
      maxResultCount: input.resultLimit
    })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(payload?.error?.message ?? "Nao foi possivel consultar o Google Places.");
  }

  const payload = (await response.json()) as {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      internationalPhoneNumber?: string;
      nationalPhoneNumber?: string;
      websiteUri?: string;
      rating?: number;
      userRatingCount?: number;
      primaryTypeDisplayName?: { text?: string };
    }>;
  };

  const records = (payload.places ?? []).map((place, index) => {
    const phone = place.internationalPhoneNumber || place.nationalPhoneNumber || null;
    return {
      id: place.id || `google-place-${index + 1}`,
      provider: "GOOGLE_PLACES" as const,
      name: place.displayName?.text || `${titleCase(input.category)} ${index + 1}`,
      category: place.primaryTypeDisplayName?.text || input.category,
      city: input.city || null,
      state: input.state || null,
      region: input.region || null,
      address: place.formattedAddress || null,
      phone,
      whatsapp: normalizeWhatsappNumber(phone),
      website: place.websiteUri || null,
      instagram: null,
      rating: typeof place.rating === "number" ? place.rating : null,
      reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : null,
      sourceLabel: providerLabel
    };
  });

  return enrichWithDuplicates(records);
}

function buildSimulationRecords(input: ProspectingSearchInput) {
  const category = titleCase(input.category);
  const city = titleCase(input.city || "Sua cidade");
  const state = (input.state || "SP").toUpperCase();
  const region = input.region ? titleCase(input.region) : null;
  const base = slugify(`${input.category}-${input.city || "local"}-${input.keyword || "busca"}`);
  const namePrefixes = ["Prime", "Studio", "Select", "Center", "Premium", "Especializada", "One", "Group"];
  const nameSuffixes = ["Clinic", "House", "Lab", "Hub", "Company", "Care", "Boutique", "Experts"];

  return Array.from({ length: input.resultLimit }).map((_, index) => {
    const sequence = index + 1;
    const prefix = namePrefixes[index % namePrefixes.length];
    const suffix = nameSuffixes[index % nameSuffixes.length];
    const digits = `${11}${String(940000000 + sequence * 137).slice(0, 9)}`;
    const businessName = `${category} ${prefix} ${suffix}`;
    const website = `https://${base}-${sequence}.example.com`;

    return {
      id: `sim-${base}-${sequence}`,
      provider: "GOOGLE_PLACES" as const,
      name: businessName,
      category,
      city,
      state,
      region,
      address: `${sequence * 47}, ${region || "Centro"} - ${city}/${state}`,
      phone: digits,
      whatsapp: digits,
      website,
      instagram: `@${slugify(businessName).replace(/-/g, "")}`,
      rating: Number((4 + ((sequence % 7) * 0.1)).toFixed(1)),
      reviewCount: 6 + sequence * 4,
      sourceLabel: `${providerLabel} (simulado)`
    };
  });
}

async function searchGooglePlacesSimulation(input: ProspectingSearchInput) {
  return enrichWithDuplicates(buildSimulationRecords(input));
}

export async function searchProspects(rawInput: ProspectingSearchInput, actor: ProspectingActor): Promise<ProspectSearchResponse> {
  const input = prospectingSearchSchema.parse(rawInput);
  const queryLabel = buildQueryLabel(input);

  const liveResults = await searchGooglePlacesLive(input).catch(() => null);
  const mode: ProspectingMode = liveResults ? "live" : "simulation";
  const results = liveResults ?? (await searchGooglePlacesSimulation(input));

  if (!isDemoMode) {
    await createActivityLog({
      userId: actor.id,
      entityType: ActivityEntity.LEAD,
      entityId: `prospecting:${Date.now()}`,
      action: "prospecting.search",
      message: `Busca externa executada para ${queryLabel}.`,
      metadata: {
        provider: input.provider,
        mode,
        resultCount: results.length
      }
    });
  }

  return {
    provider: "GOOGLE_PLACES",
    mode,
    providerLabel,
    message:
      mode === "live"
        ? "Resultados vindos do Google Places com deduplicacao automatica."
        : "Google Places ainda sem chave no ambiente. Exibindo uma simulacao guiada para voce validar o fluxo e a UX.",
    searchedAt: new Date().toISOString(),
    queryLabel,
    results
  };
}

function buildLeadNotes(item: ProspectImportInput) {
  const parts = [
    `Prospeccao externa via ${item.sourceLabel}.`,
    item.address ? `Endereco: ${item.address}.` : null,
    item.website ? `Site: ${item.website}.` : null,
    item.instagram ? `Instagram: ${item.instagram}.` : null,
    item.rating ? `Avaliacao publica: ${item.rating}/5.` : null,
    item.reviewCount ? `Avaliacoes: ${item.reviewCount}.` : null
  ];

  return parts.filter(Boolean).join(" ");
}

async function resolveExistingLead(item: ProspectImportInput) {
  if (item.duplicateLeadId) {
    return isDemoMode
      ? demoLeads.find((lead) => lead.id === item.duplicateLeadId) ?? null
      : prisma.lead.findUnique({ where: { id: item.duplicateLeadId } });
  }

  const duplicate = await findDuplicateLead({
    name: item.name,
    city: item.city,
    phone: item.phone,
    whatsapp: item.whatsapp
  });

  if (!duplicate) return null;

  return isDemoMode
    ? demoLeads.find((lead) => lead.id === duplicate.id) ?? null
    : prisma.lead.findUnique({ where: { id: duplicate.id } });
}

export async function importProspectsToLeads(options: {
  items: ProspectImportInput[];
  ownerId?: string | null;
  updateExisting?: boolean;
  actor: ProspectingActor;
}) {
  const summary = {
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[]
  };

  const ownerId = options.actor.role === "ADMIN" ? options.ownerId || options.actor.id : options.actor.id;

  for (const item of options.items) {
    summary.processed += 1;
    const normalizedPhone = normalizeWhatsappNumber(item.whatsapp || item.phone);

    if (!normalizedPhone) {
      summary.skipped += 1;
      summary.errors.push(`${item.name}: sem telefone valido para importar.`);
      continue;
    }

    const existingLead = await resolveExistingLead(item);
    const notes = buildLeadNotes(item);

    if (existingLead && !options.updateExisting) {
      summary.skipped += 1;
      summary.errors.push(`${item.name}: lead ja existe e a atualizacao esta desativada.`);
      continue;
    }

    try {
      if (existingLead) {
        if (isDemoMode) {
          summary.updated += 1;
          continue;
        }

        await updateLead(
          existingLead.id,
          {
            fullName: existingLead.fullName || item.name,
            phone: existingLead.phone || normalizedPhone,
            whatsapp: existingLead.whatsapp || normalizedPhone,
            company: existingLead.company || item.name,
            city: existingLead.city || item.city,
            state: existingLead.state || item.state,
            instagram: existingLead.instagram || item.instagram,
            sourcePrimary: LeadSourcePrimary.OTHER,
            sourceDetail: item.sourceLabel,
            source: "Prospeccao externa",
            mainInterest: existingLead.mainInterest || item.category,
            notes: [existingLead.notes, notes].filter(Boolean).join("\n\n"),
            ownerId,
            temperature: existingLead.temperature || LeadTemperature.WARM,
            urgency: existingLead.urgency || LeadUrgency.MEDIUM
          },
          options.actor
        );

        await createActivityLog({
          userId: options.actor.id,
          entityType: ActivityEntity.LEAD,
          entityId: existingLead.id,
          action: "prospecting.import.updated",
          message: `Lead ${item.name} atualizado a partir da prospeccao externa.`,
          leadId: existingLead.id
        });

        summary.updated += 1;
        continue;
      }

      if (isDemoMode) {
        summary.created += 1;
        continue;
      }

      const lead = await createLead(
        {
          fullName: item.name,
          phone: normalizedPhone,
          whatsapp: normalizedPhone,
          email: null,
          instagram: item.instagram,
          company: item.name,
          city: item.city,
          state: item.state,
          sourcePrimary: LeadSourcePrimary.OTHER,
          sourceDetail: item.sourceLabel,
          source: "Prospeccao externa",
          mainInterest: item.category,
          notes,
          ownerId,
          temperature: item.qualityScore && item.qualityScore >= 80 ? LeadTemperature.HOT : LeadTemperature.WARM,
          urgency: LeadUrgency.MEDIUM
        },
        options.actor
      );

      await createActivityLog({
        userId: options.actor.id,
        entityType: ActivityEntity.LEAD,
        entityId: lead.id,
        action: "prospecting.import.created",
        message: `Lead ${item.name} importado da prospeccao externa.`,
        leadId: lead.id
      });

      summary.created += 1;
    } catch (error) {
      summary.skipped += 1;
      summary.errors.push(`${item.name}: ${error instanceof Error ? error.message : "falha ao importar."}`);
    }
  }

  return summary;
}
