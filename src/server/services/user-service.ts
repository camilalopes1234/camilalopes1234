import { ActivityEntity, Prisma, UserRole } from "@prisma/client";

import { hashPassword } from "@/server/auth/password";
import { prisma } from "@/server/db/prisma";
import { createActivityLog } from "@/server/services/activity-log-service";

type ActingUser = {
  id: string;
  role: "ADMIN" | "SELLER";
};

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  title?: string | null;
  isActive?: boolean;
};

type UpdateUserInput = {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  title?: string | null;
  isActive?: boolean;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeTitle(title?: string | null) {
  const normalized = title?.trim();
  return normalized ? normalized : null;
}

function mapPrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return new Error("Ja existe um usuario com este email.");
  }

  return error;
}

export async function createUser(input: CreateUserInput, actingUser: ActingUser) {
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: normalizeEmail(input.email),
        passwordHash,
        role: input.role,
        title: normalizeTitle(input.title),
        isActive: input.isActive ?? true
      }
    });

    await createActivityLog({
      userId: actingUser.id,
      entityType: ActivityEntity.USER,
      entityId: user.id,
      action: "user.created",
      message: `Usuario ${user.name} criado.`,
      metadata: { role: user.role, email: user.email }
    });

    return user;
  } catch (error) {
    throw mapPrismaError(error);
  }
}

export async function updateUser(userId: string, input: UpdateUserInput, actingUser: ActingUser) {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, isActive: true }
  });

  if (!currentUser) {
    throw new Error("Usuario nao encontrado.");
  }

  if (actingUser.id === userId && input.isActive === false) {
    throw new Error("Voce nao pode desativar seu proprio acesso.");
  }

  if (actingUser.id === userId && input.role !== currentUser.role) {
    throw new Error("Voce nao pode alterar o proprio perfil de acesso.");
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name.trim(),
        email: normalizeEmail(input.email),
        role: input.role,
        title: normalizeTitle(input.title),
        isActive: input.isActive ?? true,
        passwordHash: input.password ? await hashPassword(input.password) : undefined
      }
    });

    await createActivityLog({
      userId: actingUser.id,
      entityType: ActivityEntity.USER,
      entityId: user.id,
      action: input.password ? "user.updated_with_password" : "user.updated",
      message: `Usuario ${user.name} atualizado.`,
      metadata: { role: user.role, isActive: user.isActive }
    });

    return user;
  } catch (error) {
    throw mapPrismaError(error);
  }
}
