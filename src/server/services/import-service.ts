export type LeadImportField =
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

export const leadImportFieldMap: LeadImportField[] = [
  "fullName",
  "phone",
  "whatsapp",
  "email",
  "instagram",
  "city",
  "state",
  "company",
  "sourcePrimary",
  "sourceDetail",
  "mainInterest",
  "potentialValue",
  "ownerId"
];

export function getLeadImportTemplate() {
  return {
    status: "placeholder",
    message: "Importacao CSV ainda nao implementada.",
    expectedFields: leadImportFieldMap
  };
}
