import { z } from "zod";

export const prospectingProviderSchema = z.enum(["GOOGLE_PLACES"]);

export const prospectingSearchSchema = z.object({
  provider: prospectingProviderSchema.default("GOOGLE_PLACES"),
  category: z.string().trim().min(2, "Informe uma categoria ou nicho."),
  keyword: z.string().trim().optional().nullable(),
  state: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  region: z.string().trim().optional().nullable(),
  radiusKm: z.coerce.number().min(1).max(200).default(15),
  resultLimit: z.coerce.number().min(1).max(25).default(12)
});

export const prospectImportItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  sourceLabel: z.string(),
  duplicateLeadId: z.string().optional().nullable(),
  qualityScore: z.coerce.number().min(0).max(100).optional().nullable(),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  reviewCount: z.coerce.number().min(0).optional().nullable()
});

export const prospectingImportSchema = z.object({
  ownerId: z.string().optional().nullable(),
  updateExisting: z.coerce.boolean().default(false),
  items: z.array(prospectImportItemSchema).min(1, "Selecione pelo menos um prospect para importar.")
});

export type ProspectingSearchInput = z.infer<typeof prospectingSearchSchema>;
export type ProspectImportInput = z.infer<typeof prospectImportItemSchema>;
