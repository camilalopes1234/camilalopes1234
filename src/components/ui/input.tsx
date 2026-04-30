import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border bg-white/90 px-4 py-2.5 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white",
        className
      )}
      {...props}
    />
  );
}
