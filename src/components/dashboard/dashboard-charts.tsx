"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card } from "@/components/ui/card";

type ChartItem = { label: string; total: number };

const sourceColors = ["#0f766e", "#1d4ed8", "#f59e0b", "#a855f7", "#f97316", "#e11d48", "#64748b"];

export function DashboardCharts({
  stages,
  sources
}: {
  stages: ChartItem[];
  sources: ChartItem[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
      <Card className="h-[360px] border-white/80 md:h-96">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-950">Leads por etapa</h3>
          <p className="text-sm text-slate-500">Leitura rápida do funil comercial atual.</p>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={stages}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="total" fill="#0f766e" radius={[12, 12, 0, 0]} maxBarSize={42} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="h-[360px] border-white/80 md:h-96">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-950">Origens dos leads</h3>
          <p className="text-sm text-slate-500">Entenda os canais com melhor tração.</p>
        </div>
        <div className="grid h-[85%] gap-4 md:grid-cols-[1fr_180px] md:items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={sources} dataKey="total" nameKey="label" innerRadius={62} outerRadius={98} paddingAngle={3}>
                {sources.map((entry, index) => (
                  <Cell key={entry.label} fill={sourceColors[index % sourceColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid gap-2">
            {sources.map((item, index) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sourceColors[index % sourceColors.length] }} />
                  <span className="text-xs font-medium text-slate-600">{item.label}</span>
                </div>
                <span className="text-xs font-semibold text-slate-900">{item.total}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
