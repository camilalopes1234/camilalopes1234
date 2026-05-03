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
    <Card className="space-y-4 border-white/80 bg-white/90">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-slate-950">Registrar interacao</h3>
        <p className="text-[13px] text-slate-500">Atualize o historico e ja deixe o proximo passo engatilhado.</p>
      </div>

      <form
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
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
              setError(data.error ?? "Erro ao registrar interacao.");
              toast.error(data.error ?? "Erro ao registrar interacao.");
              return;
            }

            toast.success("Interacao registrada.");
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

        <Field label="Data da interacao">
          <Input name="occurredAt" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} />
        </Field>

        <Field label="Proxima acao" hint="Preencha para follow-up e tarefa.">
          <Input name="nextActionAt" type="datetime-local" />
        </Field>

        <Field label="Gerar tarefa?">
          <Select name="generateTask" defaultValue="true">
            <option value="true">Sim</option>
            <option value="false">Nao</option>
          </Select>
        </Field>

        <div className="md:col-span-2 xl:col-span-4">
          <Field label="Descricao">
            <Textarea
              name="content"
              required
              className="min-h-16"
              placeholder="Descreva o contato, objeções, sinais de compra e o proximo passo acordado."
            />
          </Field>
        </div>

        {error ? <p className="md:col-span-2 xl:col-span-4 text-sm text-rose-600">{error}</p> : null}

        <div className="md:col-span-2 xl:col-span-4 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Registrando..." : "Registrar interacao"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
