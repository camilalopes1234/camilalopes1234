"use client";

import {
  InvestmentRange,
  LeadSourcePrimary,
  LeadStage,
  LeadStatus,
  LeadTemperature,
  LeadUrgency,
  type User
} from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  investmentRangeLabels,
  sourcePrimaryLabels,
  stageLabels,
  statusLabels,
  temperatureLabels,
  urgencyLabels
} from "@/lib/constants";

type LeadFormValues = {
  id?: string;
  fullName?: string;
  phone?: string;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  company?: string | null;
  city?: string | null;
  state?: string | null;
  sourcePrimary?: LeadSourcePrimary;
  sourceDetail?: string | null;
  source?: string;
  mainInterest?: string | null;
  investmentRange?: InvestmentRange;
  urgency?: LeadUrgency;
  notes?: string | null;
  status?: LeadStatus;
  stage?: LeadStage;
  temperature?: LeadTemperature;
  ownerId?: string;
  potentialValue?: string | number | null;
  closedValue?: string | number | null;
  attendedEvaluation?: boolean | null;
  closedAtEvaluation?: boolean | null;
  whatsappTemplate?: string | null;
  nextActionAt?: string | null;
  lossReason?: string | null;
};

export function LeadForm({
  users,
  initialValues,
  submitLabel = "Salvar lead"
}: {
  users: Pick<User, "id" | "name">[];
  initialValues?: LeadFormValues;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-slate-950">Cadastro do lead</h3>
        <p className="text-[13px] text-slate-500">Contato, qualificacao e follow-up em um fluxo mais compacto.</p>
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
            const response = await fetch(initialValues?.id ? `/api/leads/${initialValues.id}` : "/api/leads", {
              method: initialValues?.id ? "PATCH" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
              setError(data.error ?? "Nao foi possivel salvar o lead.");
              toast.error(data.error ?? "Nao foi possivel salvar o lead.");
              return;
            }

            toast.success(initialValues?.id ? "Lead atualizado com sucesso." : "Lead criado com sucesso.");
            router.push(initialValues?.id ? `/leads/${initialValues.id}` : `/leads/${data.id}`);
            router.refresh();
          });
        }}
      >
        <Field label="Nome completo">
          <Input name="fullName" defaultValue={initialValues?.fullName} required />
        </Field>
        <Field label="Telefone">
          <Input name="phone" defaultValue={initialValues?.phone} required placeholder="(11) 99999-9999" />
        </Field>
        <Field label="WhatsApp">
          <Input name="whatsapp" defaultValue={initialValues?.whatsapp ?? ""} placeholder="Se for diferente do telefone" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" defaultValue={initialValues?.email ?? ""} placeholder="lead@empresa.com" />
        </Field>
        <Field label="Instagram">
          <Input name="instagram" defaultValue={initialValues?.instagram ?? ""} placeholder="@perfil" />
        </Field>
        <Field label="Empresa">
          <Input name="company" defaultValue={initialValues?.company ?? ""} />
        </Field>
        <Field label="Cidade">
          <Input name="city" defaultValue={initialValues?.city ?? ""} />
        </Field>
        <Field label="Estado">
          <Input name="state" defaultValue={initialValues?.state ?? ""} />
        </Field>
        <Field label="Origem principal">
          <Select name="sourcePrimary" defaultValue={initialValues?.sourcePrimary ?? LeadSourcePrimary.INSTAGRAM}>
            {Object.entries(sourcePrimaryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Origem detalhada">
          <Input name="sourceDetail" defaultValue={initialValues?.sourceDetail ?? ""} placeholder="Campanha, closer, parceiro..." />
        </Field>
        <Field label="Origem livre">
          <Input name="source" defaultValue={initialValues?.source} required placeholder="Instagram, indicacao, trafego..." />
        </Field>
        <Field label="Servico de interesse">
          <Input name="mainInterest" defaultValue={initialValues?.mainInterest ?? ""} />
        </Field>
        <Field label="Faixa de investimento">
          <Select name="investmentRange" defaultValue={initialValues?.investmentRange ?? InvestmentRange.UNDEFINED}>
            {Object.entries(investmentRangeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Urgencia">
          <Select name="urgency" defaultValue={initialValues?.urgency ?? LeadUrgency.MEDIUM}>
            {Object.entries(urgencyLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Etapa do funil">
          <Select name="stage" defaultValue={initialValues?.stage ?? LeadStage.NEW}>
            {Object.entries(stageLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status geral">
          <Select name="status" defaultValue={initialValues?.status ?? LeadStatus.ACTIVE}>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Temperatura">
          <Select name="temperature" defaultValue={initialValues?.temperature ?? LeadTemperature.WARM}>
            {Object.entries(temperatureLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Responsavel">
          <Select name="ownerId" defaultValue={initialValues?.ownerId} required>
            <option value="">Selecione</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Valor potencial (R$)">
          <Input
            name="potentialValue"
            type="number"
            step="0.01"
            defaultValue={initialValues?.potentialValue?.toString() ?? ""}
            placeholder="15000"
          />
        </Field>
        <Field label="Valor fechado (R$)">
          <Input name="closedValue" type="number" step="0.01" defaultValue={initialValues?.closedValue?.toString() ?? ""} />
        </Field>
        <Field label="Proxima acao">
          <Input
            name="nextActionAt"
            type="datetime-local"
            defaultValue={initialValues?.nextActionAt ? initialValues.nextActionAt.slice(0, 16) : ""}
          />
        </Field>
        <Field label="Compareceu a avaliacao?">
          <Select name="attendedEvaluation" defaultValue={String(initialValues?.attendedEvaluation ?? false)}>
            <option value="false">Nao</option>
            <option value="true">Sim</option>
          </Select>
        </Field>
        <Field label="Fechou na avaliacao?">
          <Select name="closedAtEvaluation" defaultValue={String(initialValues?.closedAtEvaluation ?? false)}>
            <option value="false">Nao</option>
            <option value="true">Sim</option>
          </Select>
        </Field>

        <div className="md:col-span-2 xl:col-span-2">
          <Field label="Template de mensagem futura">
            <Textarea name="whatsappTemplate" defaultValue={initialValues?.whatsappTemplate ?? ""} className="min-h-16" />
          </Field>
        </div>
        <div className="md:col-span-2 xl:col-span-2">
          <Field label="Observacoes">
            <Textarea name="notes" defaultValue={initialValues?.notes ?? ""} className="min-h-16" />
          </Field>
        </div>
        <div className="md:col-span-2 xl:col-span-4">
          <Field label="Motivo de perda">
            <Textarea name="lossReason" defaultValue={initialValues?.lossReason ?? ""} className="min-h-16" />
          </Field>
        </div>

        {error ? <p className="md:col-span-2 xl:col-span-4 text-sm text-rose-600">{error}</p> : null}

        <div className="md:col-span-2 xl:col-span-4 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
