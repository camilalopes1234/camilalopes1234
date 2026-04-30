import { auth } from "@/auth";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { sourcePrimaryLabels, stageLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { getDashboardData } from "@/server/queries/dashboard";

export default async function DashboardPage() {
  const session = await auth();
  const data = await getDashboardData({ id: session!.user.id, role: session!.user.role });

  return (
    <div className="space-y-6">
      <Card className="border-white/80 bg-[linear-gradient(135deg,rgba(15,118,110,0.08),rgba(29,78,216,0.06),rgba(255,255,255,0.96))]">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              Painel executivo
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Dashboard comercial</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Visão consolidada da operação: pipeline, avaliações, propostas, conversão e desempenho por origem e responsável.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-white/85 p-4 ring-1 ring-white/80">
              <p className="text-xs text-slate-500">Valor potencial</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(data.totalPotentialValue)}</p>
            </div>
            <div className="rounded-3xl bg-slate-950 p-4 text-white">
              <p className="text-xs text-slate-400">Valor fechado</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(data.totalClosedValue)}</p>
            </div>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de leads" value={String(data.totalLeads)} description="Base comercial ativa no CRM." eyebrow="base" />
        <StatCard label="Leads novos" value={String(data.newLeads)} description="Entradas dos últimos 30 dias." accent="info" eyebrow="período" />
        <StatCard label="Em negociação" value={String(data.totalNegotiation)} description="Oportunidades quentes em andamento." accent="warning" eyebrow="funil" />
        <StatCard label="Follow-ups vencidos" value={String(data.overdueTasks)} description="Prioridades que pedem ação imediata." accent="warning" eyebrow="urgente" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Conversão" value={`${data.conversionRate.toFixed(1)}%`} description="Taxa de leads já convertidos." accent="success" />
        <StatCard label="Leads quentes" value={String(data.hotLeads)} description="Contatos com maior potencial no funil." accent="success" />
        <StatCard label="Avaliações agendadas" value={String(data.evaluationsScheduled)} description="Agenda futura confirmada ou pendente." />
        <StatCard label="Comparecimento" value={`${data.evaluationAttendanceRate.toFixed(1)}%`} description="Taxa de presença em avaliações." accent="info" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <DashboardCharts
          stages={data.leadsByStage.map((item) => ({ label: stageLabels[item.stage], total: item.total }))}
          sources={data.leadsBySource.map((item) => ({ label: sourcePrimaryLabels[item.source], total: item.total }))}
        />

        <Card className="border-white/80">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Responsáveis</h3>
              <p className="text-sm text-slate-500">Distribuição comercial por carteira.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{data.leadsByOwner.length} ativos</span>
          </div>

          <div className="mt-4 space-y-3">
            {data.leadsByOwner.map((item, index) => (
              <div key={item.ownerId} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#d9f3ef_0%,#dbeafe_100%)] text-sm font-semibold text-emerald-900">
                    {item.ownerName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("") || "CR"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{item.ownerName}</p>
                    <p className="text-xs text-slate-500">Posição #{index + 1} na carteira</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-950">{item.total}</p>
                  <p className="text-xs text-slate-500">leads</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Avaliações realizadas" value={String(data.evaluationsCompleted)} description="Agenda executada com sucesso." />
        <StatCard label="Faltas em avaliação" value={String(data.evaluationNoShow)} description="Avaliações com não comparecimento." accent="warning" />
        <StatCard label="Perdidos" value={String(data.totalLost)} description="Leads encerrados sem conversão." accent="warning" />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Propostas em curso" value={String(data.proposalsSent)} description="Enviadas ou em negociação." accent="info" />
        <StatCard label="Propostas aceitas" value={String(data.proposalsAccepted)} description="Aceites convertidos no ciclo." accent="success" />
      </section>
    </div>
  );
}
