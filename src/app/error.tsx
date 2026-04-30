"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-3xl border bg-white p-8 text-center shadow-[var(--shadow)]">
        <h2 className="text-2xl font-semibold text-slate-950">Algo saiu do fluxo</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          O sistema encontrou um erro inesperado. Você pode tentar novamente sem perder o restante da sessão.
        </p>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => reset()}>Tentar novamente</Button>
        </div>
      </div>
    </div>
  );
}
