import { auth } from "@/auth";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { getAssignableUsers } from "@/server/demo/users";
import { getLeadsForUser } from "@/server/queries/leads";

export default async function PipelinePage() {
  const session = await auth();
  const [leads, users] = await Promise.all([
    getLeadsForUser({ id: session!.user.id, role: session!.user.role }),
    getAssignableUsers({ id: session!.user.id, role: session!.user.role })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Pipeline comercial</h1>
        <p className="text-sm text-slate-500">Movimente oportunidades com drag and drop e filtre o funil em tempo real.</p>
      </div>
      <PipelineBoard leads={leads} users={users} />
    </div>
  );
}
