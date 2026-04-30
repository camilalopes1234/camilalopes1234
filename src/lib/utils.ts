import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value?: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return "R$ 0,00";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value));
}

export function formatDate(value?: Date | string | null, pattern = "dd/MM/yyyy") {
  if (!value) return "-";
  return format(new Date(value), pattern);
}

export function formatDateTime(value?: Date | string | null) {
  return formatDate(value, "dd/MM/yyyy HH:mm");
}
