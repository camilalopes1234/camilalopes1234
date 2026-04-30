"use client";

import { useTransition } from "react";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      onClick={() =>
        startTransition(async () => {
          await signOut({ callbackUrl: "/login" });
        })
      }
      disabled={isPending}
    >
      {isPending ? "Saindo..." : "Sair"}
    </Button>
  );
}
