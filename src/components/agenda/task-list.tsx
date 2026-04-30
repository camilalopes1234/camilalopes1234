import { type Lead, type Task, type User } from "@prisma/client";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

type TaskWithRelations = Task & { lead: Pick<Lead, "fullName"> | null; owner: Pick<User, "name"> };

const tones = {
  Vencidas: {
    badge: "bg-rose-100 text-rose-700",
    surface: "bg-[linear-gradient(180deg,rgba(255,241,242,0.95),rgba(255,255,255,1))]"
  },
  Hoje: {
    badge: "bg-amber-100 text-amber-700",
    surface: "bg-[linear-gradient(180deg,rgba(255,251,235,0.95),rgba(255,255,255,1))]"
  },
  "Próximas": {
    badge: "bg-sky-100 text-sky-700",
    surface: "bg-[linear-gradient(180deg,rgba(239,246,255,0.95),rgba(255,255,255,1))]"
  }
} as const;

export function TaskList({ title, tasks }: { title: "Vencidas" | "Hoje" | "Próximas"; tasks: TaskWithRelations[] }) {
  if (tasks.length === 0) {
    return <EmptyState title={title} description="Nenhuma tarefa nesta faixa no momento." />;
  }

  const tone = tones[title];

  return (
    <Card className="border-white/80">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="text-sm text-slate-500">Prioridades comerciais organizadas por momento da agenda.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}>{tasks.length}</span>
      </div>

      <div className="mt-4 space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className={`rounded-2xl border border-slate-100 p-4 ${tone.surface}`}>
            <p className="font-medium text-slate-900">{task.title}</p>
            <p className="mt-1 text-sm text-slate-500">{task.lead?.fullName ?? "Sem lead vinculado"}</p>
            {task.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{task.description}</p> : null}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>{task.owner.name}</span>
              <span>{formatDateTime(task.dueDate)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
