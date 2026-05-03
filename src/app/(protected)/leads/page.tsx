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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-1.5">
          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
            Operacao comercial
          </span>
          <h1 className="text-[30px] font-semibold tracking-tight text-slate-950">Leads</h1>
          <p className="max-w-2xl text-[13px] leading-5 text-slate-500">
            Central de cadastro, gestao, filtros e leitura rapida da base comercial em desktop e mobile.
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
