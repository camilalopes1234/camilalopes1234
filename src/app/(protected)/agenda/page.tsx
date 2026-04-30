import { auth } from "@/auth";
import { TaskList } from "@/components/agenda/task-list";
import { Card } from "@/components/ui/card";
import { getAgendaData } from "@/server/queries/agenda";

export default async function AgendaPage() {
  const session = await auth();
  const agenda = await getAgendaData({ id: session!.user.id, role: session!.user.role });

  const totalTasks = agenda.overdue.length + agenda.today.length + agenda.upcoming.length;

  return (
    <div className="space-y-6">
      <Card className="border-white/80 bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(14,165,233,0.06),rgba(255,255,255,0.96))]">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
              Agenda operacional
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Agenda comercial</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Organize follow-ups, retornos e compromissos do dia com uma visão prática para operação e gestão.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/85 p-4 ring-1 ring-white/80">
              <p className="text-xs text-slate-500">Vencidas</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{agenda.overdue.length}</p>
            </div>
            <div className="rounded-3xl bg-white/85 p-4 ring-1 ring-white/80">
              <p className="text-xs text-slate-500">Hoje</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{agenda.today.length}</p>
            </div>
            <div className="rounded-3xl bg-slate-950 p-4 text-white">
              <p className="text-xs text-slate-400">Total</p>
              <p className="mt-2 text-2xl font-semibold">{totalTasks}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <TaskList title="Vencidas" tasks={agenda.overdue} />
        <TaskList title="Hoje" tasks={agenda.today} />
        <TaskList title="Próximas" tasks={agenda.upcoming} />
      </div>
    </div>
  );
}
