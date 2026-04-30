import "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "SELLER";
    title?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "ADMIN" | "SELLER";
      title?: string | null;
    };
  }
}
