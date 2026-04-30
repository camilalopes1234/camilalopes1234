import Link from "next/link";
import { LeadStage, LeadStatus, LeadTemperature } from "@prisma/client";

import { auth } from "@/auth";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadTable } from "@/components/leads/lead-table";
import { Button } from "@/components/ui/button";
import { getAssignableUsers } from "@/server/demo/users";
import { getLeadsForUser } from "@/server/queries/leads";

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  const filters = await searchParams;
  const parsedFilters = {
    q: filters.q,
    source: filters.source,
    ownerId: filters.ownerId,
    city: filters.city,
    stage: Object.values(LeadStage).includes(filters.stage as LeadStage) ? (filters.stage as LeadStage) : undefined,
    status: Object.values(LeadStatus).includes(filters.status as LeadStatus) ? (filters.status as LeadStatus) : undefined,
    temperature: Object.values(LeadTemperature).includes(filters.temperature as LeadTemperature)
      ? (filters.temperature as LeadTemperature)
      : undefined
  };
  const [users, leads] = await Promise.all([
    getAssignableUsers({ id: session!.user.id, role: session!.user.role }),
    getLeadsForUser({ id: session!.user.id, role: session!.user.role }, parsedFilters)
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Operação comercial</span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Leads</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Central de cadastro, gestão, filtros e leitura rápida da base comercial em desktop e mobile.
          </p>
        </div>
        <Link href="/leads/new">
          <Button>Novo lead</Button>
        </Link>
      </div>

      <LeadFilters users={users} searchParams={filters} />
      <LeadTable leads={leads} />
    </div>
  );
}
