"use client";

import { OpportunityStatus, type Lead, type User } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { opportunityStatusLabels } from "@/lib/constants";

export function OpportunityForm({
  leads,
  users
}: {
  leads: Pick<Lead, "id" | "fullName">[];
  users: Pick<User, "id" | "name">[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          const form = event.currentTarget;
          const formData = new FormData(form);
          const payload = Object.fromEntries(formData.entries());

          startTransition(async () => {
            const response = await fetch("/api/opportunities", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
              setError(data.error ?? "Erro ao salvar proposta.");
              toast.error(data.error ?? "Erro ao salvar proposta.");
              return;
            }

            toast.success("Proposta registrada.");
            form.reset();
            router.refresh();
          });
        }}
      >
        <Field label="Título da oportunidade">
          <Input name="title" required />
        </Field>
        <Field label="Lead vinculado">
          <Select name="leadId" required>
            <option value="">Selecione</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.fullName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Responsável">
          <Select name="ownerId" required>
            <option value="">Selecione</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Valor estimado">
          <Input name="estimatedValue" type="number" step="0.01" />
        </Field>
        <Field label="Status da proposta">
          <Select name="status" defaultValue={OpportunityStatus.DRAFT}>
            {Object.entries(opportunityStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Data de envio">
          <Input name="sentAt" type="datetime-local" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Observações">
            <Textarea name="notes" />
          </Field>
        </div>
        {error ? <p className="md:col-span-2 text-sm text-rose-600">{error}</p> : null}
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar proposta"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
