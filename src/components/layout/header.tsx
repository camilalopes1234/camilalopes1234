import { Search } from "lucide-react";

import { LogoutButton } from "@/components/layout/logout-button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function Header({ userName, userRole, title }: { userName: string; userRole: string; title?: string | null }) {
  return (
    <Card className="flex flex-col gap-4 border-white/80 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="text-sm text-slate-500">Bem-vinda de volta</p>
        <h2 className="truncate text-2xl font-semibold tracking-tight text-slate-950">{userName}</h2>
        <p className="truncate text-sm text-slate-500">{title || userRole}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form action="/leads" className="relative w-full sm:min-w-[260px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-10" placeholder="Buscar lead, telefone, empresa..." name="q" />
        </form>
        <LogoutButton />
      </div>
    </Card>
  );
}
