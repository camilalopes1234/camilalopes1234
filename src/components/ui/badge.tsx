import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  children
}: {
  className?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tone === "default" && "bg-slate-100 text-slate-700",
        tone === "success" && "bg-emerald-100 text-emerald-700",
        tone === "warning" && "bg-amber-100 text-amber-700",
        tone === "danger" && "bg-rose-100 text-rose-700",
        tone === "info" && "bg-sky-100 text-sky-700",
        className
      )}
    >
      {children}
    </span>
  );
}
