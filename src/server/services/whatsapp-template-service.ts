import { ActivityEntity, Prisma, type UserRole } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { isDemoMode } from "@/server/demo/mode";
import { createActivityLog } from "@/server/services/activity-log-service";

type Actor = {
  id: string;
  role: UserRole;
};

type TemplateInput = {
  name: string;
  displayName: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION" | "SERVICE";
  languageCode: string;
  bodyText: string;
  variableKeys?: string | null;
  isApproved?: boolean;
};

function parseVariableKeys(value?: string | null) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function createWhatsappTemplate(input: TemplateInput, actor: Actor) {
  if (isDemoMode) {
    return { id: `demo-template-${Date.now()}` };
  }

  try {
    const template = await prisma.whatsAppTemplate.create({
      data: {
        name: input.name.trim(),
        displayName: input.displayName.trim(),
        category: input.category,
        languageCode: input.languageCode.trim(),
        bodyText: input.bodyText.trim(),
        variableKeys: parseVariableKeys(input.variableKeys),
        isApproved: input.isApproved ?? false,
        createdById: actor.id
      }
    });

    await createActivityLog({
      userId: actor.id,
      entityType: ActivityEntity.WHATSAPP_TEMPLATE,
      entityId: template.id,
      action: "whatsapp_template.created",
      message: `Template ${template.displayName} criado.`,
      metadata: {
        technicalName: template.name,
        category: template.category,
        isApproved: template.isApproved
      }
    });

    return template;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Ja existe um template com este nome tecnico.");
    }

    throw error;
  }
}
