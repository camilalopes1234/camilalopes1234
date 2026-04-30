import { UserRole, type User } from "@prisma/client";

export function isAdmin(user: Pick<User, "role"> | { role: UserRole }) {
  return user.role === "ADMIN";
}

export function canAccessOwnerData(user: Pick<User, "id" | "role">, ownerId: string) {
  return isAdmin(user) || user.id === ownerId;
}
