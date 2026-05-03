import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 text-[13px] text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none ring-0 transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]",
        className
      )}
      {...props}
    />
  );
}
