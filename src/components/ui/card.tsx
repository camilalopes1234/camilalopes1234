import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/60 bg-[var(--card)] p-5 shadow-[var(--shadow)] backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
