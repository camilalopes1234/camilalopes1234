"use client";

import Link from "next/link";
import { BarChart3, BriefcaseBusiness, CalendarRange, ClipboardCheck, KanbanSquare, MessageSquareMore, Settings, Users } from "lucide-react";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/agenda", label: "Agenda Comercial", icon: CalendarRange },
  { href: "/evaluations", label: "Avaliacoes", icon: ClipboardCheck },
  { href: "/conversations", label: "Chatbot", icon: MessageSquareMore },
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
        "sticky top-4 flex w-full flex-col rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] p-5 text-white shadow-2xl shadow-slate-900/15 transition-all duration-300",
        collapsed ? "lg:w-[88px]" : "lg:w-72"
      )}
    >
      <div className="mb-8">
        {collapsed ? (
          <div className="flex h-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold">PS</div>
        ) : (
          <>
            <Badge className="mb-4 bg-emerald-500/15 text-emerald-200" tone="default">
              CRM Consultivo
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight">Premium Sales</h1>
            <p className="mt-2 text-sm text-slate-400">Operacao comercial moderna para servicos de alto valor.</p>
          </>
        )}
      </div>

      <nav className="space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = currentPath.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "rounded-2xl px-4 py-3 text-sm transition-all duration-200",
                active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span>{item.label}</span> : null}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
