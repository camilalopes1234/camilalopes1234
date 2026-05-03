import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  description,
  accent = "default",
  eyebrow
}: {
  label: string;
  value: string;
  description: string;
  accent?: "default" | "success" | "info" | "warning";
  eyebrow?: string;
}) {
  return (
    <Card
      className={cn(
        "space-y-2.5 border-white/80",
        accent === "success" && "bg-[linear-gradient(180deg,rgba(236,253,245,0.92),rgba(255,255,255,0.96))]",
        accent === "info" && "bg-[linear-gradient(180deg,rgba(239,246,255,0.92),rgba(255,255,255,0.96))]",
        accent === "warning" && "bg-[linear-gradient(180deg,rgba(255,251,235,0.92),rgba(255,255,255,0.96))]"
      )}
    >
      {eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p> : null}
      <div className="space-y-1">
        <p className="text-[13px] text-slate-500">{label}</p>
        <p className="text-[30px] font-semibold tracking-tight text-slate-950">{value}</p>
      </div>
      <p className="text-[13px] leading-5 text-slate-500">{description}</p>
    </Card>
  );
}
