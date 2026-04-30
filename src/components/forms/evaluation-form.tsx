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
    <Card className="border-white/80 bg-white/90">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-950">Agendar avaliação</h3>
        <p className="text-sm text-slate-500">Crie o compromisso comercial e deixe a jornada registrada no CRM.</p>
      </div>

      <form
        className="grid gap-4"
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
              setError(data.error ?? "Não foi possível agendar a avaliação.");
              toast.error(data.error ?? "Não foi possível agendar a avaliação.");
              return;
            }

            toast.success("Avaliação agendada.");
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

        <Field label="Observações pré-avaliação" hint="Inclua contexto da conversa, objeções ou expectativas para o encontro.">
          <Textarea name="preNotes" placeholder="Ex.: cliente quer avaliar prazo, investimento e modelo comercial ideal." />
        </Field>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Agendando..." : "Agendar avaliação"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
