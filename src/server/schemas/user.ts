import { UserRole } from "@prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(3, "Informe o nome do usuario."),
  email: z.string().email("Informe um email valido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  role: z.nativeEnum(UserRole).default(UserRole.SELLER),
  title: z.string().optional().nullable(),
  isActive: z.coerce.boolean().default(true)
});

export const updateUserSchema = z.object({
  name: z.string().min(3, "Informe o nome do usuario."),
  email: z.string().email("Informe um email valido."),
  password: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => value === undefined || value.length >= 8, {
      message: "A nova senha precisa ter pelo menos 8 caracteres."
    }),
  role: z.nativeEnum(UserRole).default(UserRole.SELLER),
  title: z.string().optional().nullable(),
  isActive: z.coerce.boolean().default(true)
});
