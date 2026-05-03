"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function EvaluationForm({ leadId, ownerId }: { leadId: string; ownerId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="space-y-4 border-white/80 bg-white/90">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-slate-950">Agendar avaliacao</h3>
        <p className="text-[13px] text-slate-500">Crie o compromisso sem ocupar a tela toda.</p>
      </div>

      <form
        className="grid gap-3 md:grid-cols-[0.95fr_1.05fr]"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          const form = event.currentTarget;
          const formData = new FormData(form);
          const payload = Object.fromEntries(formData.entries());

          startTransition(async () => {
            const response = await fetch("/api/evaluations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (!response.ok) {
              setError(data.error ?? "Nao foi possivel agendar a avaliacao.");
              toast.error(data.error ?? "Nao foi possivel agendar a avaliacao.");
              return;
            }

            toast.success("Avaliacao agendada.");
            form.reset();
            router.refresh();
          });
        }}
      >
        <input type="hidden" name="leadId" value={leadId} />
        <input type="hidden" name="ownerId" value={ownerId} />

        <Field label="Data e hora">
          <Input name="scheduledAt" type="datetime-local" required />
        </Field>

        <Field label="Observacoes pre-avaliacao" hint="Contexto rapido para o encontro.">
          <Textarea name="preNotes" className="min-h-16" placeholder="Ex.: cliente quer avaliar prazo, investimento e modelo ideal." />
        </Field>

        {error ? <p className="md:col-span-2 text-sm text-rose-600">{error}</p> : null}

        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Agendando..." : "Agendar avaliacao"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
