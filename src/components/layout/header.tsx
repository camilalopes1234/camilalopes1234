import { Search } from "lucide-react";

import { LogoutButton } from "@/components/layout/logout-button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function Header({ userName, userRole, title }: { userName: string; userRole: string; title?: string | null }) {
  return (
    <Card className="flex flex-col gap-3 border-white/80 py-3.5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="text-[12px] uppercase tracking-[0.08em] text-slate-500">Bem-vinda de volta</p>
        <h2 className="truncate text-[26px] font-semibold tracking-tight text-slate-950">{userName}</h2>
        <p className="truncate text-[13px] text-slate-500">{title || userRole}</p>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <form action="/leads" className="relative w-full sm:min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Buscar lead ou empresa" name="q" />
        </form>
        <LogoutButton />
      </div>
    </Card>
  );
}
