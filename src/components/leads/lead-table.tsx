import Link from "next/link";
import { type Conversation, type Lead, type Message, type Task, type User } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { stageLabels, temperatureLabels } from "@/lib/constants";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type LeadRow = Lead & {
  owner: Pick<User, "name">;
  tasks: Pick<Task, "dueDate">[];
  conversations?: Array<Conversation & { messages: Pick<Message, "body" | "caption">[] }>;
};

function getConversationSnippet(lead: LeadRow) {
  const message = lead.conversations?.[0]?.messages?.[0];
  if (message?.body?.trim()) return message.body.trim();
  if (message?.caption?.trim()) return message.caption.trim();
  if (lead.notes?.trim()) return lead.notes.trim();
  return "Sem conversa registrada ainda.";
}

export function LeadTable({ leads }: { leads: LeadRow[] }) {
  if (leads.length === 0) {
    return <EmptyState title="Nenhum lead encontrado" description="Ajuste os filtros ou cadastre um novo lead para começar." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-white/80 bg-white/85">
          <p className="text-xs text-slate-500">Leads encontrados</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{leads.length}</p>
        </Card>
        <Card className="border-white/80 bg-white/85">
          <p className="text-xs text-slate-500">Valor potencial</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatCurrency(leads.reduce((sum, lead) => sum + Number(lead.potentialValue ?? 0), 0))}
          </p>
        </Card>
        <Card className="border-white/80 bg-white/85">
          <p className="text-xs text-slate-500">Leads quentes</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{leads.filter((lead) => lead.temperature === "HOT").length}</p>
        </Card>
        <Card className="border-white/80 bg-white/85">
          <p className="text-xs text-slate-500">Negociação e proposta</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {leads.filter((lead) => ["NEGOTIATION", "PROPOSAL_SENT"].includes(lead.stage)).length}
          </p>
        </Card>
      </div>

      <div className="grid gap-3 lg:hidden">
        {leads.map((lead) => (
          <Link key={lead.id} href={`/leads/${lead.id}`}>
            <Card className="border-white/80 bg-white/90 transition hover:-translate-y-0.5 hover:border-emerald-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-950">{lead.fullName}</p>
                  <p className="truncate text-sm text-slate-500">{lead.phone}</p>
                </div>
                <Badge tone="info" className="shrink-0">
                  {stageLabels[lead.stage]}
                </Badge>
              </div>

              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{getConversationSnippet(lead)}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge tone="default">{lead.source}</Badge>
                <Badge tone={lead.temperature === "HOT" ? "success" : lead.temperature === "WARM" ? "warning" : "default"}>
                  {temperatureLabels[lead.temperature]}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Valor</p>
                  <p className="font-medium text-slate-900">{formatCurrency(lead.potentialValue?.toString())}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Próxima ação</p>
                  <p className="font-medium text-slate-900">{formatDate(lead.tasks[0]?.dueDate ?? lead.nextActionAt)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-400">Responsável</p>
                  <p className="font-medium text-slate-900">{lead.owner.name}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="hidden overflow-hidden border-white/80 p-0 lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Lead</th>
                <th className="px-5 py-4 font-medium">Resumo</th>
                <th className="px-5 py-4 font-medium">Origem</th>
                <th className="px-5 py-4 font-medium">Etapa</th>
                <th className="px-5 py-4 font-medium">Temperatura</th>
                <th className="px-5 py-4 font-medium">Valor</th>
                <th className="px-5 py-4 font-medium">Próxima ação</th>
                <th className="px-5 py-4 font-medium">Responsável</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100 bg-white/70 transition hover:bg-white">
                  <td className="px-5 py-4">
                    <Link href={`/leads/${lead.id}`} className="font-medium text-slate-900 hover:text-emerald-700">
                      {lead.fullName}
                    </Link>
                    <div className="text-xs text-slate-500">{lead.phone}</div>
                  </td>
                  <td className="max-w-[280px] px-5 py-4 text-slate-500">
                    <p className="line-clamp-2">{getConversationSnippet(lead)}</p>
                  </td>
                  <td className="px-5 py-4">{lead.source}</td>
                  <td className="px-5 py-4">
                    <Badge tone="info">{stageLabels[lead.stage]}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        lead.temperature === "HOT"
                          ? "bg-emerald-100 text-emerald-700"
                          : lead.temperature === "WARM"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {temperatureLabels[lead.temperature]}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-900">{formatCurrency(lead.potentialValue?.toString())}</td>
                  <td className="px-5 py-4">{formatDate(lead.tasks[0]?.dueDate ?? lead.nextActionAt)}</td>
                  <td className="px-5 py-4">{lead.owner.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
