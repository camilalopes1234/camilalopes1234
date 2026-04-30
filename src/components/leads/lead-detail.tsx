"use client";

import { type Evaluation, LeadStage, type Interaction, type Lead, type Opportunity, type Task, type User } from "@prisma/client";
import { CalendarClock, Copy, MessageCircle, Pencil, Phone, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { EvaluationForm } from "@/components/forms/evaluation-form";
import { InteractionForm } from "@/components/forms/interaction-form";
import { LeadForm } from "@/components/forms/lead-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  evaluationStatusLabels,
  interactionTypeLabels,
  opportunityStatusLabels,
  stageLabels,
  taskStatusLabels,
  temperatureLabels
} from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type LeadDetailProps = {
  lead: Lead & {
    owner: Pick<User, "name">;
    interactions: (Interaction & { user: Pick<User, "name"> })[];
    opportunities: (Opportunity & { owner: Pick<User, "name"> })[];
    tasks: (Task & { owner: Pick<User, "name"> })[];
    evaluations: (Evaluation & { owner: Pick<User, "name"> })[];
  };
  users: Pick<User, "id" | "name">[];
};

export function LeadDetail({ lead, users }: LeadDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function updateStage(stage: LeadStage) {
    const closedValue = stage === LeadStage.CLOSED ? window.prompt("Informe o valor fechado:") : undefined;
    const lossReason = stage === LeadStage.LOST ? window.prompt("Informe o motivo de perda:") : undefined;

    startTransition(async () => {
      const response = await fetch(`/api/leads/${lead.id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          closedValue: closedValue ? Number(closedValue) : null,
          lossReason: lossReason || null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Nao foi possivel atualizar o estagio.");
        return;
      }

      toast.success("Lead atualizado.");
      router.refresh();
    });
  }

  async function openConversation() {
    const response = await fetch(`/api/leads/${lead.id}/conversation`, {
      method: "POST"
    });
    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error ?? "Nao foi possivel abrir a conversa.");
      return;
    }

    router.push(`/conversations?conversationId=${data.id}`);
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/80 bg-[linear-gradient(135deg,rgba(15,118,110,0.08),rgba(29,78,216,0.05),rgba(255,255,255,0.98))]">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">{stageLabels[lead.stage]}</Badge>
              <Badge tone={lead.temperature === "HOT" ? "success" : lead.temperature === "WARM" ? "warning" : "default"}>
                {temperatureLabels[lead.temperature]}
              </Badge>
              <Badge tone="default">{lead.source}</Badge>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{lead.fullName}</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">{lead.notes || "Lead em acompanhamento comercial consultivo."}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl bg-white/85 p-4 ring-1 ring-white/80">
                <p className="text-xs text-slate-500">Potencial</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{formatCurrency(lead.potentialValue?.toString())}</p>
              </div>
              <div className="rounded-3xl bg-white/85 p-4 ring-1 ring-white/80">
                <p className="text-xs text-slate-500">Próxima ação</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{formatDateTime(lead.nextActionAt)}</p>
              </div>
              <div className="rounded-3xl bg-white/85 p-4 ring-1 ring-white/80">
                <p className="text-xs text-slate-500">Última interação</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{formatDateTime(lead.lastInteractionAt)}</p>
              </div>
              <div className="rounded-3xl bg-slate-950 p-4 text-white">
                <p className="text-xs text-slate-400">Responsável</p>
                <p className="mt-2 text-sm font-semibold">{lead.owner.name}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => updateStage(LeadStage.CLOSED)} disabled={isPending}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Marcar como fechado
              </Button>
              <Button variant="danger" onClick={() => updateStage(LeadStage.LOST)} disabled={isPending}>
                Marcar como perdido
              </Button>
              <Button variant="ghost" onClick={() => document.getElementById("editar-lead")?.scrollIntoView({ behavior: "smooth" })}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar lead
              </Button>
              {lead.whatsapp ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(lead.whatsapp ?? "");
                      toast.success("Numero copiado.");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar WhatsApp
                  </Button>
                  <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                    <Button variant="ghost">
                      <Phone className="mr-2 h-4 w-4" />
                      Abrir WhatsApp
                    </Button>
                  </a>
                  <Button variant="ghost" onClick={() => void openConversation()}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Abrir inbox
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Card className="border-white/80 bg-white/90">
              <h3 className="text-sm font-semibold text-slate-950">Contato</h3>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>{lead.phone}</p>
                <p>{lead.email || "-"}</p>
                <p>{lead.instagram || "-"}</p>
              </div>
            </Card>
            <Card className="border-white/80 bg-white/90">
              <h3 className="text-sm font-semibold text-slate-950">Contexto</h3>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>{lead.company || "Sem empresa"}</p>
                <p>{[lead.city, lead.state].filter(Boolean).join(" / ") || "Sem localização"}</p>
                <p>{lead.mainInterest || "Sem interesse principal definido"}</p>
              </div>
            </Card>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <Card className="border-white/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Timeline de interações</h3>
                <p className="text-sm text-slate-500">Histórico comercial mais recente do lead.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{lead.interactions.length}</span>
            </div>
            <div className="mt-5 space-y-4">
              {lead.interactions.length === 0 ? <p className="text-sm text-slate-500">Nenhuma interação registrada.</p> : null}
              {lead.interactions.map((interaction) => (
                <div key={interaction.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{interactionTypeLabels[interaction.type]}</p>
                      <p className="text-xs text-slate-500">{interaction.user.name}</p>
                    </div>
                    <span className="text-xs text-slate-500">{formatDateTime(interaction.occurredAt)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{interaction.content}</p>
                </div>
              ))}
            </div>
          </Card>

          <InteractionForm leadId={lead.id} />
          <EvaluationForm leadId={lead.id} ownerId={lead.ownerId} />

          <div id="editar-lead">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-950">Editar lead</h3>
              <p className="text-sm text-slate-500">Atualize dados cadastrais, responsável e próximos passos.</p>
            </div>
            <LeadForm
              users={users}
              initialValues={{
                ...lead,
                potentialValue: lead.potentialValue?.toString(),
                closedValue: lead.closedValue?.toString(),
                nextActionAt: lead.nextActionAt?.toISOString() ?? null
              }}
              submitLabel="Salvar alterações"
            />
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-white/80">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-950">Tarefas e follow-ups</h3>
              <CalendarClock className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-4 space-y-3">
              {lead.tasks.length === 0 ? <p className="text-sm text-slate-500">Nenhuma tarefa vinculada.</p> : null}
              {lead.tasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <Badge tone={task.status === "PENDING" ? "warning" : "success"}>{taskStatusLabels[task.status]}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{formatDateTime(task.dueDate)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-white/80">
            <h3 className="text-lg font-semibold text-slate-950">Avaliações</h3>
            <div className="mt-4 space-y-3">
              {lead.evaluations.length === 0 ? <p className="text-sm text-slate-500">Nenhuma avaliação registrada.</p> : null}
              {lead.evaluations.map((evaluation) => (
                <div key={evaluation.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{evaluation.owner.name}</p>
                    <Badge tone="info">{evaluationStatusLabels[evaluation.status]}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{formatDateTime(evaluation.scheduledAt)}</p>
                  <p className="mt-1 text-sm text-slate-500">{evaluation.preNotes || evaluation.postNotes || "Sem observações."}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-white/80">
            <h3 className="text-lg font-semibold text-slate-950">Propostas registradas</h3>
            <div className="mt-4 space-y-3">
              {lead.opportunities.length === 0 ? <p className="text-sm text-slate-500">Nenhuma proposta registrada.</p> : null}
              {lead.opportunities.map((opportunity) => (
                <div key={opportunity.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{opportunity.title}</p>
                    <Badge tone="info">{opportunityStatusLabels[opportunity.status]}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{formatCurrency(opportunity.estimatedValue?.toString())}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
