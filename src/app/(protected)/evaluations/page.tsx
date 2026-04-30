import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { evaluationStatusLabels } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { getEvaluationsData } from "@/server/queries/evaluations";

function EvaluationSection({
  title,
  items
}: {
  title: string;
  items: { id: string; scheduledAt: Date; status: keyof typeof evaluationStatusLabels; lead: { fullName: string }; owner: { name: string } }[];
}) {
  if (items.length === 0) {
    return <EmptyState title={title} description="Nenhum registro nesta faixa no momento." />;
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-slate-900">{item.lead.fullName}</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {evaluationStatusLabels[item.status]}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{item.owner.name}</p>
            <p className="mt-1 text-sm text-slate-500">{formatDateTime(item.scheduledAt)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default async function EvaluationsPage() {
  const session = await auth();
  const data = await getEvaluationsData({ id: session!.user.id, role: session!.user.role });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Avaliacoes</h1>
        <p className="text-sm text-slate-500">Acompanhe agenda do dia, proximas avaliacoes, faltas e realizadas.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <EvaluationSection title="Hoje" items={data.today} />
        <EvaluationSection title="Proximas" items={data.upcoming} />
        <EvaluationSection title="Faltas" items={data.noShow} />
        <EvaluationSection title="Realizadas" items={data.completed} />
      </div>
    </div>
  );
}
