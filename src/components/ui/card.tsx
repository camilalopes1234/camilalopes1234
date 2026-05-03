import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-white/70 bg-[var(--card)] p-4 shadow-[var(--shadow)] backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
