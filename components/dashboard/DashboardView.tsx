"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Bot, Flame } from "lucide-react";
import { getMetricsAction } from "@/app/actions";
import type { Lead, Metrics, PeriodKey } from "@/lib/types";
import { cn, formatCurrency, formatRelativeDay } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Card, PageHeader, Skeleton } from "@/components/ui/Primitives";
import { FunnelBlocks } from "./FunnelBlocks";
import { MetricCard } from "./MetricCard";
import { PeriodFilter } from "./PeriodFilter";

interface DashboardViewProps {
  initialMetrics?: Metrics | null;
  initialLeads?: Lead[];
  userName?: string;
}

export function DashboardView({
  initialMetrics = null,
  initialLeads = [],
  userName = "Rafael",
}: DashboardViewProps) {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [metrics, setMetrics] = useState<Metrics | null>(initialMetrics);
  const [isPending, startTransition] = useTransition();

  function handlePeriodChange(nextPeriod: PeriodKey) {
    setPeriod(nextPeriod);
    startTransition(async () => {
      try {
        const m = await getMetricsAction(nextPeriod);
        setMetrics(m);
      } catch (err) {
        console.error("Erro ao atualizar métricas:", err);
      }
    });
  }

  const loading = isPending || !metrics;

  return (
    <>
      <PageHeader
        title={`Olá, ${userName.split(" ")[0]} 👋`}
        description="Resumo do atendimento e da conversão dos seus leads de energia solar."
        actions={<PeriodFilter value={period} onChange={handlePeriodChange} />}
      />

      <section
        aria-label="Métricas"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {loading || !metrics
          ? Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[178px] rounded-2xl" />
          ))
          : metrics.items.map((m, i) => (
            <MetricCard key={m.key} metric={m} index={i} />
          ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Funil de vendas
              </h2>
              <p className="text-sm text-slate-500">
                Onde estão as oportunidades qualificadas
              </p>
            </div>
            <Link
              href="/vendas"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              Ver kanban <ArrowRight className="size-4" />
            </Link>
          </div>
          {loading || !metrics ? (
            <Skeleton className="h-48" />
          ) : (
            <FunnelBlocks stages={metrics.funnel} />
          )}
        </Card>

        <AttentionList leads={initialLeads} />
      </div>
    </>
  );
}

/** Leads aguardando consultor ou leads quentes com a IA — prontos para alguém assumir. */
function AttentionList({ leads = [] }: { leads: Lead[] }) {
  const aguardandoConsultor = leads.filter(
    (l) => l.attendance === "humano" && !l.assignedTo
  );
  const hotIa = leads.filter(
    (l) => l.status === "quente" && l.attendance === "ia"
  );
  const hot = [...aguardandoConsultor, ...hotIa].slice(0, 5);

  return (
    <Card className="flex flex-col p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <Flame className="size-4" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold leading-tight text-slate-900">
            Precisam de você
          </h2>
          <p className="text-xs text-slate-500">
            {aguardandoConsultor.length > 0
              ? "Leads aguardando atendimento ou quentes"
              : "Leads quentes ainda com a IA"}
          </p>
        </div>
      </div>

      <ul className="-mx-2 flex-1 space-y-1">
        {hot.length === 0 && (
          <li className="px-2 py-8 text-center text-sm text-slate-400">
            Nenhum lead esperando. 🎉
          </li>
        )}
        {hot.map((lead) => {
          const isAguardando = lead.attendance === "humano" && !lead.assignedTo;
          return (
            <li key={lead.id}>
              <Link
                href={`/leads/${lead.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-slate-50",
                  isAguardando &&
                    "bg-amber-50/80 ring-1 ring-amber-200/80 hover:bg-amber-100/70"
                )}
              >
                <Avatar name={lead.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {lead.name}
                    </p>
                    {isAguardando && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-300/60">
                        Aguardando consultor
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {lead.city}-{lead.state} ·{" "}
                    {formatCurrency(lead.billValue)}/mês
                  </p>
                </div>
                <span className="text-[11px] text-slate-400">
                  {formatRelativeDay(lead.createdAt).replace("Hoje, ", "")}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50/70 px-3 py-2.5 text-xs text-blue-800">
        <Bot className="size-4 shrink-0" />A IA continua atendendo até alguém
        assumir.
      </div>
    </Card>
  );
}
