import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-[var(--primary)] text-white shadow-lg shadow-emerald-950/10 hover:bg-emerald-700",
        variant === "secondary" && "bg-slate-900 text-white hover:bg-slate-800",
        variant === "ghost" && "bg-white/70 text-slate-700 ring-1 ring-slate-200 hover:bg-white",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
        className
      )}
      {...props}
    />
  );
}
