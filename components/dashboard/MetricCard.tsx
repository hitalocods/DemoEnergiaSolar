import { ArrowDownRight, ArrowUpRight, BadgeCheck, Bot, Inbox, Trophy, UserCheck, XCircle, type LucideIcon } from "lucide-react";
import type { MetricItem, MetricKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";

const META: Record<MetricKey, { icon: LucideIcon; color: string; chip: string; inverse?: boolean }> = {
  recebidos: { icon: Inbox, color: "#1D4ED8", chip: "bg-blue-50 text-blue-700" },
  atendidosIA: { icon: Bot, color: "#4F46E5", chip: "bg-indigo-50 text-indigo-700" },
  qualificados: { icon: BadgeCheck, color: "#0891B2", chip: "bg-cyan-50 text-cyan-700" },
  assumidos: { icon: UserCheck, color: "#7C3AED", chip: "bg-violet-50 text-violet-700" },
  vendas: { icon: Trophy, color: "#16A34A", chip: "bg-green-50 text-green-700" },
  perdidos: { icon: XCircle, color: "#DC2626", chip: "bg-red-50 text-red-600", inverse: true },
};

export function MetricCard({ metric, index = 0 }: { metric: MetricItem; index?: number }) {
  const meta = META[metric.key];
  const Icon = meta.icon;
  const up = metric.change >= 0;
  // Para "Perdidos", cair é bom.
  const good = meta.inverse ? !up : up;

  return (
    <article
      style={{ animationDelay: `${index * 50}ms` }}
      className="group animate-fade-up rounded-2xl border border-slate-200/70 bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-start justify-between">
        <span className={cn("flex size-10 items-center justify-center rounded-xl", meta.chip)}>
          <Icon className="size-5" />
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-bold tabular",
            good ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
          )}
        >
          {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {Math.abs(metric.change).toLocaleString("pt-BR")}%
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">{metric.label}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="font-display text-3xl font-extrabold tracking-tight text-slate-900 tabular">{metric.value}</p>
        <div className="w-28 shrink-0 sm:w-32">
          <Sparkline data={metric.trend} color={meta.color} id={metric.key} />
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400">vs. período anterior</p>
    </article>
  );
}
