"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="p-8">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">Acesso seguro</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Entrar no CRM</h2>
        <p className="mt-2 text-sm text-slate-500">Use seu email corporativo e senha para continuar.</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          const formData = new FormData(event.currentTarget);

          startTransition(async () => {
            const response = await signIn("credentials", {
              email: formData.get("email"),
              password: formData.get("password"),
              redirect: false
            });

            if (response?.error) {
              setError("Credenciais inválidas. Confira email e senha.");
              return;
            }

            router.push("/dashboard");
            router.refresh();
          });
        }}
      >
        <Field label="Email">
          <Input name="email" type="email" placeholder="voce@empresa.com" required />
        </Field>
        <Field label="Senha">
          <Input name="password" type="password" placeholder="••••••••" required />
        </Field>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </Card>
  );
}
