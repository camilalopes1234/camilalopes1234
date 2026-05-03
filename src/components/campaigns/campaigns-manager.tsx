"use client";

import {
  LeadSourcePrimary,
  LeadStage,
  LeadTemperature,
  WhatsAppCampaignSendMode,
  WhatsAppCampaignStatus,
  WhatsAppTemplateCategory
} from "@prisma/client";
import { Megaphone, Send, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  roleLabels,
  sourcePrimaryLabels,
  stageLabels,
  temperatureLabels,
  whatsappCampaignRecipientStatusLabels,
  whatsappCampaignSendModeLabels,
  whatsappCampaignStatusLabels,
  whatsappTemplateCategoryLabels
} from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

type OwnerOption = {
  id: string;
  name: string;
};

type TemplateOption = {
  id: string;
  name: string;
  displayName: string;
  category: WhatsAppTemplateCategory;
  languageCode: string;
  bodyText: string;
  isApproved: boolean;
};

type CampaignItem = {
  id: string;
  title: string;
  description: string | null;
  sendMode: WhatsAppCampaignSendMode;
  status: WhatsAppCampaignStatus;
  messageBody: string;
  audienceSearch: string | null;
  filterStage: LeadStage | null;
  filterSourcePrimary: LeadSourcePrimary | null;
  filterTemperature: LeadTemperature | null;
  filterOwnerId: string | null;
  filterCity: string | null;
  requiresOptIn: boolean;
  recipientsCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  skippedCount: number;
  scheduledAt: string | Date | null;
  startedAt: string | Date | null;
  completedAt: string | Date | null;
  lastDispatchAt: string | Date | null;
  createdAt: string | Date;
  templateId: string | null;
  template: TemplateOption | null;
  createdBy: {
    name: string;
    role: "ADMIN" | "SELLER";
  };
  recipients: Array<{
    id: string;
    personalizedBody: string | null;
    status: "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED" | "SKIPPED";
    failureReason: string | null;
    lead: {
      id: string;
      fullName: string;
      whatsapp: string | null;
      phone: string;
      city: string | null;
    };
  }>;
};

function getRecipientTone(status: CampaignItem["recipients"][number]["status"]): "default" | "success" | "warning" | "danger" | "info" {
  if (status === "FAILED") return "danger";
  if (status === "READ" || status === "DELIVERED") return "success";
  if (status === "SENT") return "info";
  if (status === "SKIPPED") return "warning";
  return "default";
}

function CampaignStatusBadge({ status }: { status: WhatsAppCampaignStatus }) {
  const tone =
    status === WhatsAppCampaignStatus.COMPLETED
      ? "success"
      : status === WhatsAppCampaignStatus.PROCESSING
        ? "info"
        : status === WhatsAppCampaignStatus.FAILED
          ? "danger"
          : status === WhatsAppCampaignStatus.PAUSED
            ? "warning"
            : "default";

  return <Badge tone={tone}>{whatsappCampaignStatusLabels[status]}</Badge>;
}

function CampaignForm({
  templates,
  owners,
  initialValues,
  submitLabel,
  currentUserRole
}: {
  templates: TemplateOption[];
  owners: OwnerOption[];
  initialValues?: Partial<CampaignItem>;
  submitLabel: string;
  currentUserRole: "ADMIN" | "SELLER";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sendMode, setSendMode] = useState<WhatsAppCampaignSendMode>(initialValues?.sendMode ?? WhatsAppCampaignSendMode.TEXT);

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const formData = new FormData(event.currentTarget);
        const payload = Object.fromEntries(formData.entries());

        startTransition(async () => {
          const response = await fetch(initialValues?.id ? `/api/campaigns/${initialValues.id}` : "/api/campaigns", {
            method: initialValues?.id ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await response.json();

          if (!response.ok) {
            setError(data.error ?? "Nao foi possivel salvar a campanha.");
            toast.error(data.error ?? "Nao foi possivel salvar a campanha.");
            return;
          }

          toast.success(initialValues?.id ? "Campanha atualizada." : "Campanha criada.");
          router.refresh();
          if (!initialValues?.id) {
            event.currentTarget.reset();
            setSendMode(WhatsAppCampaignSendMode.TEXT);
          }
        });
      }}
    >
      <Field label="Nome da campanha">
        <Input name="title" defaultValue={initialValues?.title ?? ""} required />
      </Field>
      <Field label="Modo de envio">
        <Select name="sendMode" defaultValue={initialValues?.sendMode ?? WhatsAppCampaignSendMode.TEXT} onChange={(event) => setSendMode(event.target.value as WhatsAppCampaignSendMode)}>
          {Object.entries(whatsappCampaignSendModeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <div className="md:col-span-2">
        <Field label="Descricao interna">
          <Textarea name="description" defaultValue={initialValues?.description ?? ""} placeholder="Objetivo, audiencia e observacoes da operacao." />
        </Field>
      </div>
      {sendMode === WhatsAppCampaignSendMode.TEMPLATE ? (
        <Field label="Template oficial">
          <Select name="templateId" defaultValue={initialValues?.templateId ?? ""} required>
            <option value="">Selecione</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.displayName} {template.isApproved ? "" : "(rascunho)"}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <Field label="Template oficial">
          <Select name="templateId" defaultValue={initialValues?.templateId ?? ""}>
            <option value="">Opcional</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.displayName}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Responsavel alvo">
        <Select name="filterOwnerId" defaultValue={initialValues?.filterOwnerId ?? ""} disabled={currentUserRole !== "ADMIN"}>
          <option value="">Todos os responsaveis</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="md:col-span-2">
        <Field label="Mensagem base">
          <Textarea
            name="messageBody"
            defaultValue={initialValues?.messageBody ?? ""}
            required
            placeholder="Ex.: Oi {{primeiro_nome}}, aqui e {{responsavel}}. Quero te mostrar uma condicao especial para {{interesse}}."
          />
        </Field>
      </div>
      <Field label="Etapa do funil">
        <Select name="filterStage" defaultValue={initialValues?.filterStage ?? ""}>
          <option value="">Todas</option>
          {Object.entries(stageLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Origem principal">
        <Select name="filterSourcePrimary" defaultValue={initialValues?.filterSourcePrimary ?? ""}>
          <option value="">Todas</option>
          {Object.entries(sourcePrimaryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Temperatura">
        <Select name="filterTemperature" defaultValue={initialValues?.filterTemperature ?? ""}>
          <option value="">Todas</option>
          {Object.entries(temperatureLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Cidade">
        <Input name="filterCity" defaultValue={initialValues?.filterCity ?? ""} placeholder="Ex.: Sao Paulo" />
      </Field>
      <Field label="Busca complementar">
        <Input name="audienceSearch" defaultValue={initialValues?.audienceSearch ?? ""} placeholder="Nome, telefone, empresa, interesse..." />
      </Field>
      <Field label="Agendamento futuro">
        <Input name="scheduledAt" type="datetime-local" defaultValue={initialValues?.scheduledAt ? String(initialValues.scheduledAt).slice(0, 16) : ""} />
      </Field>
      <Field label="Exigir opt-in">
        <Select name="requiresOptIn" defaultValue={String(initialValues?.requiresOptIn ?? false)}>
          <option value="false">Nao</option>
          <option value="true">Sim</option>
        </Select>
      </Field>

      {error ? <p className="md:col-span-2 text-sm text-rose-600">{error}</p> : null}

      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function TemplateForm({ templates }: { templates: TemplateOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">Templates aprovados e internos</h3>
        <p className="text-sm text-slate-500">Cadastre modelos para a equipe e marque como aprovados quando ja existirem na Meta.</p>
      </div>

      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          const formData = new FormData(event.currentTarget);
          const payload = Object.fromEntries(formData.entries());

          startTransition(async () => {
            const response = await fetch("/api/whatsapp-templates", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (!response.ok) {
              setError(data.error ?? "Nao foi possivel salvar o template.");
              toast.error(data.error ?? "Nao foi possivel salvar o template.");
              return;
            }

            toast.success("Template salvo com sucesso.");
            event.currentTarget.reset();
            router.refresh();
          });
        }}
      >
        <Field label="Nome tecnico">
          <Input name="name" placeholder="reativacao_premium" required />
        </Field>
        <Field label="Nome exibido">
          <Input name="displayName" placeholder="Reativacao premium" required />
        </Field>
        <Field label="Categoria">
          <Select name="category" defaultValue={WhatsAppTemplateCategory.MARKETING}>
            {Object.entries(whatsappTemplateCategoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Idioma">
          <Input name="languageCode" defaultValue="pt_BR" required />
        </Field>
        <div className="md:col-span-2">
          <Field label="Corpo base">
            <Textarea name="bodyText" placeholder="Oi {{primeiro_nome}}, aqui e {{responsavel}}..." required />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Variaveis do body">
            <Input name="variableKeys" placeholder="primeiro_nome,responsavel,interesse" />
          </Field>
        </div>
        <Field label="Ja aprovado na Meta?">
          <Select name="isApproved" defaultValue="false">
            <option value="false">Nao</option>
            <option value="true">Sim</option>
          </Select>
        </Field>

        {error ? <p className="md:col-span-2 text-sm text-rose-600">{error}</p> : null}

        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar template"}
          </Button>
        </div>
      </form>

      <div className="grid gap-3">
        {templates.map((template) => (
          <div key={template.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-slate-950">{template.displayName}</p>
              <Badge tone={template.isApproved ? "success" : "warning"}>{template.isApproved ? "Aprovado" : "Interno"}</Badge>
              <Badge tone="info">{whatsappTemplateCategoryLabels[template.category]}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">{template.bodyText}</p>
            <p className="mt-2 text-xs text-slate-400">
              Nome tecnico: {template.name} · Idioma: {template.languageCode}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CampaignsManager({
  templates,
  campaigns,
  owners,
  currentUserRole
}: {
  templates: TemplateOption[];
  campaigns: CampaignItem[];
  owners: OwnerOption[];
  currentUserRole: "ADMIN" | "SELLER";
}) {
  const router = useRouter();
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-700">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Nova campanha de WhatsApp</h3>
              <p className="text-sm text-slate-500">
                Segmente a base, monte a mensagem com variaveis e deixe o CRM pronto para disparos controlados e rastreaveis.
              </p>
            </div>
          </div>

          <CampaignForm templates={templates} owners={owners} submitLabel="Criar campanha" currentUserRole={currentUserRole} />
        </Card>

        <div className="space-y-4">
          <Card className="grid gap-4">
            <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-4">
              <p className="text-sm text-emerald-700">Campanhas cadastradas</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-950">{campaigns.length}</p>
            </div>
            <div className="rounded-[24px] border border-sky-100 bg-sky-50/80 p-4">
              <p className="text-sm text-sky-700">Templates disponiveis</p>
              <p className="mt-2 text-3xl font-semibold text-sky-950">{templates.length}</p>
            </div>
            <div className="rounded-[24px] border border-amber-100 bg-amber-50/80 p-4">
              <p className="text-sm text-amber-700">Prontas para disparo</p>
              <p className="mt-2 text-3xl font-semibold text-amber-950">{campaigns.filter((campaign) => campaign.status === WhatsAppCampaignStatus.READY).length}</p>
            </div>
          </Card>

          <TemplateForm templates={templates} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Campanhas salvas</h2>
            <p className="text-sm text-slate-500">Envie apenas com template aprovado, base filtrada e historico completo por destinatario.</p>
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
            Placeholders: {"{{primeiro_nome}} {{nome}} {{cidade}} {{empresa}} {{interesse}} {{responsavel}}"}
          </div>
        </div>

        {campaigns.length === 0 ? (
          <EmptyState
            title="Nenhuma campanha ainda"
            description="Cadastre o primeiro template e monte a primeira campanha para reativacao, follow-up ou ofertas segmentadas."
          />
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-lg font-semibold text-slate-950">{campaign.title}</p>
                      <CampaignStatusBadge status={campaign.status} />
                      <Badge tone="info">{whatsappCampaignSendModeLabels[campaign.sendMode]}</Badge>
                      {campaign.template ? <Badge tone={campaign.template.isApproved ? "success" : "warning"}>{campaign.template.displayName}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{campaign.description || "Sem descricao interna."}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Criada por {campaign.createdBy.name} ({roleLabels[campaign.createdBy.role]}) em {formatDateTime(campaign.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      disabled={dispatchingId === campaign.id}
                      onClick={() => {
                        setDispatchingId(campaign.id);
                        void fetch(`/api/campaigns/${campaign.id}/dispatch`, { method: "POST" })
                          .then(async (response) => {
                            const data = await response.json();
                            if (!response.ok) {
                              throw new Error(data.error ?? "Nao foi possivel disparar a campanha.");
                            }
                            toast.success(`Campanha disparada para ${data.processed} destinatarios.`);
                            router.refresh();
                          })
                          .catch((error: Error) => {
                            toast.error(error.message);
                          })
                          .finally(() => setDispatchingId(null));
                      }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {dispatchingId === campaign.id ? "Disparando..." : "Disparar agora"}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-3">
                    <p className="text-xs text-slate-500">Destinatarios</p>
                    <p className="mt-1 text-xl font-semibold text-slate-950">{campaign.recipientsCount}</p>
                  </div>
                  <div className="rounded-[20px] border border-sky-100 bg-sky-50/70 p-3">
                    <p className="text-xs text-sky-700">Enviadas</p>
                    <p className="mt-1 text-xl font-semibold text-sky-950">{campaign.sentCount}</p>
                  </div>
                  <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/70 p-3">
                    <p className="text-xs text-emerald-700">Entregues/Lidas</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-950">{campaign.deliveredCount + campaign.readCount}</p>
                  </div>
                  <div className="rounded-[20px] border border-rose-100 bg-rose-50/70 p-3">
                    <p className="text-xs text-rose-700">Falhas</p>
                    <p className="mt-1 text-xl font-semibold text-rose-950">{campaign.failedCount}</p>
                  </div>
                  <div className="rounded-[20px] border border-amber-100 bg-amber-50/70 p-3">
                    <p className="text-xs text-amber-700">Ignoradas</p>
                    <p className="mt-1 text-xl font-semibold text-amber-950">{campaign.skippedCount}</p>
                  </div>
                  <div className="rounded-[20px] border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">Ultimo disparo</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">{campaign.lastDispatchAt ? formatDateTime(campaign.lastDispatchAt) : "Nunca"}</p>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-sm font-medium text-slate-900">Mensagem base</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{campaign.messageBody}</p>
                    </div>

                    <CampaignForm
                      templates={templates}
                      owners={owners}
                      initialValues={campaign}
                      submitLabel="Salvar alteracoes"
                      currentUserRole={currentUserRole}
                    />
                  </div>

                  <div className="space-y-4">
                    <Card className="space-y-3 border-slate-200 bg-slate-50/70">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-700" />
                        <p className="font-medium text-slate-950">Segmentacao ativa</p>
                      </div>
                      <div className="space-y-2 text-sm text-slate-600">
                        <p>Etapa: {campaign.filterStage ? stageLabels[campaign.filterStage] : "Todas"}</p>
                        <p>Origem: {campaign.filterSourcePrimary ? sourcePrimaryLabels[campaign.filterSourcePrimary] : "Todas"}</p>
                        <p>Temperatura: {campaign.filterTemperature ? temperatureLabels[campaign.filterTemperature] : "Todas"}</p>
                        <p>Cidade: {campaign.filterCity || "Qualquer cidade"}</p>
                        <p>Busca: {campaign.audienceSearch || "Sem termo adicional"}</p>
                        <p>Opt-in exigido: {campaign.requiresOptIn ? "Sim" : "Nao"}</p>
                      </div>
                    </Card>

                    <Card className="space-y-3 border-slate-200 bg-white">
                      <p className="font-medium text-slate-950">Amostra de destinatarios</p>
                      <div className="space-y-3">
                        {campaign.recipients.length === 0 ? (
                          <p className="text-sm text-slate-500">Nenhum destinatario encaixou nesses filtros ainda.</p>
                        ) : (
                          campaign.recipients.map((recipient) => (
                            <div key={recipient.id} className="rounded-[20px] border border-slate-100 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-slate-950">{recipient.lead.fullName}</p>
                                  <p className="truncate text-xs text-slate-500">{recipient.lead.whatsapp || recipient.lead.phone}</p>
                                </div>
                                <Badge tone={getRecipientTone(recipient.status)}>
                                  {whatsappCampaignRecipientStatusLabels[recipient.status]}
                                </Badge>
                              </div>
                              <p className="mt-2 line-clamp-2 text-xs text-slate-500">{recipient.personalizedBody || "Personalizacao sera aplicada no disparo."}</p>
                              {recipient.failureReason ? <p className="mt-2 text-xs text-rose-600">{recipient.failureReason}</p> : null}
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
