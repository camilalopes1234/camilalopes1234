"use client";

import { InteractionType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { interactionTypeLabels } from "@/lib/constants";

export function InteractionForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="border-white/80 bg-white/90">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-950">Registrar interação</h3>
        <p className="text-sm text-slate-500">Documente contato, próximo passo e mantenha o histórico comercial sempre atualizado.</p>
      </div>

      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          const form = event.currentTarget;
          const formData = new FormData(form);
          const payload = Object.fromEntries(formData.entries());

          startTransition(async () => {
            const response = await fetch(`/api/leads/${leadId}/interactions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
              setError(data.error ?? "Erro ao registrar interação.");
              toast.error(data.error ?? "Erro ao registrar interação.");
              return;
            }

            toast.success("Interação registrada.");
            form.reset();
            router.refresh();
          });
        }}
      >
        <Field label="Tipo">
          <Select name="type" defaultValue={InteractionType.WHATSAPP}>
            {Object.entries(interactionTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Data da interação">
          <Input name="occurredAt" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} />
        </Field>

        <Field label="Próxima ação" hint="Se preenchida, o CRM poderá usar essa data para follow-up e tarefa comercial.">
          <Input name="nextActionAt" type="datetime-local" />
        </Field>

        <Field label="Gerar tarefa automaticamente?">
          <Select name="generateTask" defaultValue="true">
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </Select>
        </Field>

        <div className="md:col-span-2">
          <Field label="Descrição">
            <Textarea name="content" required placeholder="Descreva o contato, objeções, sinais de compra e o próximo passo acordado." />
          </Field>
        </div>

        {error ? <p className="md:col-span-2 text-sm text-rose-600">{error}</p> : null}

        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Registrando..." : "Registrar interação"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
