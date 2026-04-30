import { auth } from "@/auth";
import { OpportunityForm } from "@/components/forms/opportunity-form";
import { OpportunitiesTable } from "@/components/opportunities/opportunities-table";
import { getAssignableUsers } from "@/server/demo/users";
import { getLeadsForUser } from "@/server/queries/leads";
import { getOpportunities } from "@/server/queries/opportunities";

export default async function OpportunitiesPage() {
  const session = await auth();
  const [opportunities, leads, users] = await Promise.all([
    getOpportunities({ id: session!.user.id, role: session!.user.role }),
    getLeadsForUser({ id: session!.user.id, role: session!.user.role }),
    getAssignableUsers({ id: session!.user.id, role: session!.user.role })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Propostas e oportunidades</h1>
        <p className="text-sm text-slate-500">Registre propostas, acompanhe status e centralize oportunidades high ticket.</p>
      </div>
      <OpportunityForm leads={leads} users={users} />
      <OpportunitiesTable opportunities={opportunities} />
    </div>
  );
}
