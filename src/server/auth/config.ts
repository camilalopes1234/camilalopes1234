import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import NextAuth from "next-auth";
import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import { demoUsers } from "@/server/demo/data";
import { isDemoMode } from "@/server/demo/mode";
import { verifyPassword } from "@/server/auth/password";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const authSecret =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV !== "production" ? "dev-only-secret-change-in-production" : undefined);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: isDemoMode ? undefined : PrismaAdapter(prisma),
  secret: authSecret,
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        if (isDemoMode) {
          const demoUser = demoUsers.find(
            (user) => user.email === parsed.data.email && user.password === parsed.data.password && user.isActive
          );

          if (!demoUser) {
            return null;
          }

          return {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role,
            title: demoUser.title
          };
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email }
        });

        if (!user?.isActive) {
          return null;
        }

        const isValid = await verifyPassword(parsed.data.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          title: user.title
        };
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      const mutableToken = token as typeof token & {
        id?: string;
        role?: "ADMIN" | "SELLER";
        title?: string | null;
      };

      if (user) {
        mutableToken.id = String(user.id);
        mutableToken.role = user.role as "ADMIN" | "SELLER";
        mutableToken.title = user.title as string | null | undefined;
      }

      return mutableToken;
    },
    session({ session, token }) {
      const sessionToken = token as typeof token & {
        id?: string;
        role?: "ADMIN" | "SELLER";
        title?: string | null;
      };

      if (session.user) {
        session.user.id = sessionToken.id ?? "";
        session.user.role = sessionToken.role ?? "SELLER";
        session.user.title = sessionToken.title;
      }

      return session;
    }
  }
});
