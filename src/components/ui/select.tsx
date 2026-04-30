import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-2xl border bg-white/90 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-white",
        className
      )}
      {...props}
    />
  );
}
