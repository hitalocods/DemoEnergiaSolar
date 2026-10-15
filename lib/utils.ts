// Utilitários de formatação e apresentação (puros, sem estado).

import type { FunnelStageId, LeadStatus } from "./types";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const formatCurrency = (value: number, fractionDigits = 0) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

export function initials(name: string) {
  const parts = name.split(" ").filter((p) => p.length > 2 || /^[A-ZÀ-Ú]/.test(p));
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "").replace(/^55/, "");
  if (d.length !== 11) return phone;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** "14:32" se hoje, "Ontem, 14:32" ou "12/10, 14:32". */
export function formatRelativeDay(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const time = formatTime(iso);
  if (date.toDateString() === today.toDateString()) return `Hoje, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Ontem, ${time}`;
  return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${time}`;
}

export function whatsappUrl(phone: string, name?: string) {
  const text = name
    ? `Olá, ${name.split(" ")[0]}! Aqui é da EBS Energia Solar, tudo bem? ☀️`
    : "Olá! Aqui é da EBS Energia Solar ☀️";
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export const yesNo = (value: boolean | null, yes = "Sim", no = "Não") =>
  value === null ? "Não informado" : value ? yes : no;

export const STATUS_META: Record<LeadStatus, { label: string; className: string; dot: string }> = {
  quente: { label: "Quente", className: "bg-red-50 text-red-700 ring-red-600/15", dot: "bg-red-500" },
  morno: { label: "Morno", className: "bg-orange-50 text-orange-700 ring-orange-600/15", dot: "bg-orange-500" },
  aguardando_conta: {
    label: "Aguardando conta",
    className: "bg-amber-50 text-amber-800 ring-amber-600/20",
    dot: "bg-amber-500",
  },
};

export const STAGE_META: Record<FunnelStageId, { label: string; accent: string; soft: string; text: string }> = {
  proposta: { label: "Proposta", accent: "bg-blue-600", soft: "bg-blue-50", text: "text-blue-700" },
  negociacao: { label: "Negociação", accent: "bg-violet-500", soft: "bg-violet-50", text: "text-violet-700" },
  venda: { label: "Venda", accent: "bg-green-600", soft: "bg-green-50", text: "text-green-700" },
  perdido: { label: "Perdido", accent: "bg-red-500", soft: "bg-red-50", text: "text-red-700" },
};

export const STAGE_ORDER: FunnelStageId[] = ["proposta", "negociacao", "venda", "perdido"];
