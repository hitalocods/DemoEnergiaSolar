import { ChevronRight, FileText, Handshake, Trophy, XCircle, type LucideIcon } from "lucide-react";
import type { FunnelStage, FunnelStageId } from "@/lib/types";
import { cn } from "@/lib/utils";

const META: Record<FunnelStageId, { icon: LucideIcon; bar: string; chip: string; ring: string }> = {
  proposta: { icon: FileText, bar: "bg-blue-600", chip: "bg-blue-50 text-blue-700", ring: "hover:ring-blue-200" },
  negociacao: { icon: Handshake, bar: "bg-violet-500", chip: "bg-violet-50 text-violet-700", ring: "hover:ring-violet-200" },
  venda: { icon: Trophy, bar: "bg-green-600", chip: "bg-green-50 text-green-700", ring: "hover:ring-green-200" },
  perdido: { icon: XCircle, bar: "bg-red-500", chip: "bg-red-50 text-red-600", ring: "hover:ring-red-200" },
};

export function FunnelBlocks({ stages }: { stages: FunnelStage[] }) {
  const total = stages.reduce((sum, s) => sum + s.count, 0);

  return (
    <div>
      {/* Barra de distribuição */}
      <div className="mb-5 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        {stages.map((s) => (
          <div
            key={s.id}
            className={cn("h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full", META[s.id].bar)}
            style={{ width: `${s.percent}%` }}
            title={`${s.label}: ${s.percent}%`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stages.map((stage, i) => {
          const meta = META[stage.id];
          const Icon = meta.icon;
          return (
            <div
              key={stage.id}
              className={cn(
                "relative rounded-2xl bg-slate-50/80 p-4 ring-1 ring-inset ring-slate-200/60 transition hover:bg-white",
                meta.ring,
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("flex size-9 items-center justify-center rounded-xl", meta.chip)}>
                  <Icon className="size-[18px]" />
                </span>
                <span className="text-xs font-bold text-slate-400 tabular">{stage.percent}%</span>
              </div>
              <p className="mt-3 text-[13px] font-medium text-slate-500">{stage.label}</p>
              <p className="font-display text-2xl font-extrabold text-slate-900 tabular">{stage.count}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200/70">
                <div className={cn("h-full rounded-full transition-all duration-700", meta.bar)} style={{ width: `${stage.percent}%` }} />
              </div>
              {i < stages.length - 1 && (
                <ChevronRight className="absolute -right-3 top-1/2 z-10 hidden size-5 -translate-y-1/2 rounded-full bg-white p-0.5 text-slate-300 shadow-sm xl:block" />
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        {total} oportunidades no funil · percentuais sobre o total do período
      </p>
    </div>
  );
}
