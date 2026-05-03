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
    <div className="space-y-5">
      <Card className="border-white/80 bg-[linear-gradient(135deg,rgba(15,118,110,0.08),rgba(29,78,216,0.05),rgba(255,255,255,0.96))]">
        <div className="grid gap-5 lg:grid-cols-[1.22fr_0.78fr] lg:items-end">
          <div className="space-y-2.5">
            <span className="inline-flex rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-100">
              Painel executivo
            </span>
            <h1 className="text-[30px] font-semibold tracking-tight text-slate-950">Dashboard comercial</h1>
            <p className="max-w-2xl text-[13px] leading-5 text-slate-600">
              Visao consolidada da operacao: pipeline, avaliacoes, propostas, conversao e desempenho por origem e responsavel.
            </p>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-[22px] bg-white/85 p-3.5 ring-1 ring-white/80">
              <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Valor potencial</p>
              <p className="mt-1.5 text-[28px] font-semibold text-slate-950">{formatCurrency(data.totalPotentialValue)}</p>
            </div>
            <div className="rounded-[22px] bg-slate-950 p-3.5 text-white">
              <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Valor fechado</p>
              <p className="mt-1.5 text-[28px] font-semibold">{formatCurrency(data.totalClosedValue)}</p>
            </div>
          </div>
        </div>
      </Card>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de leads" value={String(data.totalLeads)} description="Base comercial ativa no CRM." eyebrow="base" />
        <StatCard label="Leads novos" value={String(data.newLeads)} description="Entradas dos ultimos 30 dias." accent="info" eyebrow="periodo" />
        <StatCard label="Em negociacao" value={String(data.totalNegotiation)} description="Oportunidades quentes em andamento." accent="warning" eyebrow="funil" />
        <StatCard label="Follow-ups vencidos" value={String(data.overdueTasks)} description="Prioridades que pedem acao imediata." accent="warning" eyebrow="urgente" />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Conversao" value={`${data.conversionRate.toFixed(1)}%`} description="Taxa de leads ja convertidos." accent="success" />
        <StatCard label="Leads quentes" value={String(data.hotLeads)} description="Contatos com maior potencial no funil." accent="success" />
        <StatCard label="Avaliacoes agendadas" value={String(data.evaluationsScheduled)} description="Agenda futura confirmada ou pendente." />
        <StatCard label="Comparecimento" value={`${data.evaluationAttendanceRate.toFixed(1)}%`} description="Taxa de presenca em avaliacoes." accent="info" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.42fr_0.98fr]">
        <DashboardCharts
          stages={data.leadsByStage.map((item) => ({ label: stageLabels[item.stage], total: item.total }))}
          sources={data.leadsBySource.map((item) => ({ label: sourcePrimaryLabels[item.source], total: item.total }))}
        />

        <Card className="border-white/80">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Responsaveis</h3>
              <p className="text-[13px] text-slate-500">Distribuicao comercial por carteira.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{data.leadsByOwner.length} ativos</span>
          </div>

          <div className="mt-3.5 space-y-2.5">
            {data.leadsByOwner.map((item, index) => (
              <div key={item.ownerId} className="flex items-center justify-between gap-3 rounded-[18px] bg-slate-50 px-3.5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#d9f3ef_0%,#dbeafe_100%)] text-[12px] font-semibold text-emerald-900">
                    {item.ownerName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("") || "CR"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{item.ownerName}</p>
                    <p className="text-[11px] text-slate-500">Posicao #{index + 1} na carteira</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-950">{item.total}</p>
                  <p className="text-[11px] text-slate-500">leads</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Avaliacoes realizadas" value={String(data.evaluationsCompleted)} description="Agenda executada com sucesso." />
        <StatCard label="Faltas em avaliacao" value={String(data.evaluationNoShow)} description="Avaliacoes com nao comparecimento." accent="warning" />
        <StatCard label="Perdidos" value={String(data.totalLost)} description="Leads encerrados sem conversao." accent="warning" />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <StatCard label="Propostas em curso" value={String(data.proposalsSent)} description="Enviadas ou em negociacao." accent="info" />
        <StatCard label="Propostas aceitas" value={String(data.proposalsAccepted)} description="Aceites convertidos no ciclo." accent="success" />
      </section>
    </div>
  );
}
