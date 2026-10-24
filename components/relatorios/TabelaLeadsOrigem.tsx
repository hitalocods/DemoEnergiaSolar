"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Globe,
  Loader2,
  Megaphone,
  QrCode,
  Share2,
  Store,
  TrendingUp,
} from "lucide-react";
import { getRelatorioOrigemAction } from "@/app/actions";
import type { RelatorioOrigemItem } from "@/lib/data";
import type { PeriodKey } from "@/lib/types";
import { cn } from "@/lib/utils";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
];

function getOrigemIcon(origemNome: string, tipo?: string) {
  const norm = (origemNome || "").toLowerCase();
  if (norm.includes("instagram") || tipo === "instagram") return InstagramIcon;
  if (norm.includes("google meu negócio") || norm.includes("gmn") || tipo === "google_meu_negocio")
    return Store;
  if (norm.includes("google") || tipo === "google_ads") return Globe;
  if (norm.includes("meta") || norm.includes("facebook") || tipo === "meta_ads")
    return Megaphone;
  if (norm.includes("qr") || tipo === "qr") return QrCode;
  if (norm.includes("site") || tipo === "site") return Globe;
  return Share2;
}

export function TabelaLeadsOrigem({
  initialData = [],
  initialPeriod = "30d",
}: {
  initialData?: RelatorioOrigemItem[];
  initialPeriod?: PeriodKey;
}) {
  const [period, setPeriod] = useState<PeriodKey>(initialPeriod);
  const [data, setData] = useState<RelatorioOrigemItem[]>(initialData);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await getRelatorioOrigemAction(period);
        setData(res);
      } catch (err) {
        console.error("Erro ao carregar relatório de origens:", err);
      }
    });
  }, [period]);

  const totalLeads = data.reduce((acc, i) => acc + i.leads, 0);
  const totalQualificados = data.reduce((acc, i) => acc + i.qualificados, 0);
  const totalVendas = data.reduce((acc, i) => acc + i.vendas, 0);
  const taxaGeral =
    totalLeads > 0 ? Number(((totalVendas / totalLeads) * 100).toFixed(1)) : 0;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-6">
      {/* Cabeçalho da Tabela e Seletor de Período */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-600/20">
              <TrendingUp className="size-4" />
            </span>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Leads por Origem
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe o volume real de leads, qualificação e conversão em vendas
            por canal de aquisição (excluindo leads de teste).
          </p>
        </div>

        {/* Filtro de Período idêntico ao do Dashboard */}
        <div
          role="radiogroup"
          aria-label="Período do relatório"
          className="flex self-start rounded-xl bg-slate-100 p-1 sm:self-auto"
        >
          {PERIODS.map((p) => {
            const active = period === p.key;
            return (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={isPending}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da Tabela */}
      <div className="mt-6 overflow-x-auto">
        {isPending ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-slate-400" />
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm font-semibold text-slate-600">
              Nenhum lead real registrado neste período.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Assim que os primeiros contatos chegarem pelos canais ou WhatsApp,
              as métricas aparecerão aqui.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 text-xs font-semibold text-slate-500">
                <th className="pb-3 pl-1 font-bold uppercase tracking-wider">Origem</th>
                <th className="pb-3 text-right font-bold uppercase tracking-wider">Leads</th>
                <th className="pb-3 text-right font-bold uppercase tracking-wider">Qualificados</th>
                <th className="pb-3 text-right font-bold uppercase tracking-wider">Vendas</th>
                <th className="pb-3 pr-1 text-right font-bold uppercase tracking-wider">Taxa de Conversão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item, idx) => {
                const Icon = getOrigemIcon(item.origem, item.origemTipo);
                return (
                  <tr key={idx} className="transition hover:bg-slate-50/60">
                    <td className="py-3.5 pl-1 font-medium text-slate-800">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Icon className="size-3.5" />
                        </span>
                        <span>{item.origem}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right font-semibold text-slate-700 tabular">
                      {item.leads}
                    </td>
                    <td className="py-3.5 text-right font-medium text-slate-600 tabular">
                      {item.qualificados}
                    </td>
                    <td className="py-3.5 text-right font-bold text-emerald-700 tabular">
                      {item.vendas}
                    </td>
                    <td className="py-3.5 pr-1 text-right font-bold text-slate-900 tabular">
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700 ring-1 ring-inset ring-blue-600/15">
                        {item.taxaConversao}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-bold text-slate-900">
                <td className="py-3.5 pl-3">Total do Período</td>
                <td className="py-3.5 text-right tabular">{totalLeads}</td>
                <td className="py-3.5 text-right tabular">{totalQualificados}</td>
                <td className="py-3.5 text-right text-emerald-700 tabular">{totalVendas}</td>
                <td className="py-3.5 pr-3 text-right tabular text-blue-700">
                  {taxaGeral}%
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
