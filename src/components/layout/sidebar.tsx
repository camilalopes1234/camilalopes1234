"use client";

import Link from "next/link";
import { BarChart3, BriefcaseBusiness, Building2, CalendarRange, ClipboardCheck, KanbanSquare, Megaphone, MessageSquareMore, Settings, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { UserRole } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/agenda", label: "Agenda Comercial", icon: CalendarRange },
  { href: "/evaluations", label: "Avaliacoes", icon: ClipboardCheck },
  { href: "/conversations", label: "Chatbot", icon: MessageSquareMore },
  { href: "/campaigns", label: "Campanhas WA", icon: Megaphone },
  { href: "/prospecting", label: "Prospeccao", icon: Building2 },
  { href: "/opportunities", label: "Propostas", icon: BriefcaseBusiness },
  { href: "/users", label: "Usuarios", icon: Users, adminOnly: true },
  { href: "/settings", label: "Configuracoes", icon: Settings }
];

export function Sidebar({ collapsed = false, userRole }: { collapsed?: boolean; userRole: UserRole | string }) {
  const currentPath = usePathname();
  const visibleItems = items.filter((item) => !item.adminOnly || userRole === "ADMIN");

  return (
    <aside
      className={cn(
        "sticky top-4 flex w-full flex-col rounded-[26px] border border-white/60 bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] p-4 text-white shadow-2xl shadow-slate-900/15 transition-all duration-300",
        collapsed ? "lg:w-[82px]" : "lg:w-64"
      )}
    >
      <div className="mb-6">
        {collapsed ? (
          <div className="flex h-11 items-center justify-center rounded-xl bg-white/10 text-base font-semibold tracking-[0.12em]">PS</div>
        ) : (
          <>
            <Badge className="mb-3 bg-emerald-500/15 text-emerald-200" tone="default">
              CRM Consultivo
            </Badge>
            <h1 className="text-[22px] font-semibold tracking-tight">Premium Sales</h1>
            <p className="mt-1.5 text-[13px] leading-5 text-slate-400">Operacao comercial moderna para servicos de alto valor.</p>
          </>
        )}
      </div>

      <nav className="space-y-1.5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex w-full rounded-xl px-3 py-2.5 text-[13px] transition-all duration-200",
                collapsed && "justify-center px-0",
                active ? "bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-2.5")}>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
