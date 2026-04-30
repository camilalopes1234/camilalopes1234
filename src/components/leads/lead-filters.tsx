import { type User } from "@prisma/client";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { stageLabels, statusLabels, temperatureLabels } from "@/lib/constants";

export function LeadFilters({
  users,
  searchParams
}: {
  users: Pick<User, "id" | "name">[];
  searchParams: Record<string, string | undefined>;
}) {
  return (
    <Card className="border-white/80 bg-white/85">
      <form className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_repeat(5,minmax(0,1fr))]">
          <Input name="q" placeholder="Buscar nome, telefone, email..." defaultValue={searchParams.q} />
          <Select name="stage" defaultValue={searchParams.stage}>
            <option value="">Todas as etapas</option>
            {Object.entries(stageLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input name="source" placeholder="Origem" defaultValue={searchParams.source} />
          <Select name="temperature" defaultValue={searchParams.temperature}>
            <option value="">Temperatura</option>
            {Object.entries(temperatureLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select name="status" defaultValue={searchParams.status}>
            <option value="">Status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select name="ownerId" defaultValue={searchParams.ownerId}>
            <option value="">Responsável</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit">Aplicar filtros</Button>
          <Link
            href="/leads"
            className={cn(
              "inline-flex items-center justify-center rounded-2xl bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-white"
            )}
          >
            Limpar
          </Link>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Filtros comerciais</span>
        </div>
      </form>
    </Card>
  );
}
