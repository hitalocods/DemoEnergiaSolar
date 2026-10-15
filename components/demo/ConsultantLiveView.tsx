"use client";

import {
  Building,
  CheckCircle2,
  Coins,
  FileCheck2,
  Home,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  UserCheck,
  Wallet,
  Zap,
} from "lucide-react";
import type { Lead } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface ConsultantLiveViewProps {
  lead: Lead | null;
  onNovoLead: () => void;
  onLimparLeads: () => void;
  isNovoLoading?: boolean;
  isLimparLoading?: boolean;
}

export function ConsultantLiveView({
  lead,
  onNovoLead,
  onLimparLeads,
  isNovoLoading = false,
  isLimparLoading = false,
}: ConsultantLiveViewProps) {
  const temCidade = Boolean(
    lead?.city &&
      lead.city.trim() !== "" &&
      lead.city.trim().toLowerCase() !== "não informada"
  );
  const temConta = Boolean(lead?.billValue && lead.billValue > 0);
  const temTipo = Boolean(lead?.propertyType);
  const temProprio = lead?.ownProperty !== null && lead?.ownProperty !== undefined;
  const temFinanc =
    lead?.wantsFinancing !== null && lead?.wantsFinancing !== undefined;
  const temFoto = Boolean(lead?.billSent);
  const recusouFoto = Boolean(lead?.refusedPhoto);

  const economia = lead?.billValue ? lead.billValue * 0.8 : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Barra de Ações Superior */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="font-display text-base font-bold text-slate-900 sm:text-lg">
              O que o consultor vê
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Card do CRM atualizando em tempo real conforme o lead responde no WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNovoLead}
            disabled={isNovoLoading || isLimparLoading}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 transition hover:bg-blue-100 disabled:opacity-50"
          >
            <Plus className="size-3.5" />
            {isNovoLoading ? "Criando..." : "Novo lead"}
          </button>

          <button
            type="button"
            onClick={onLimparLeads}
            disabled={isNovoLoading || isLimparLoading}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            {isLimparLoading ? "Limpando..." : "Limpar leads de demo"}
          </button>
        </div>
      </div>

      {/* Card Principal do Lead em Tempo Real */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft transition-all sm:p-6">
        {/* Cabeçalho do Card */}
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <Avatar name={lead?.name || "Visitante Demo"} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {lead?.name || "Visitante Demo"}
                </h3>
                <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 ring-1 ring-inset ring-purple-600/20">
                  DEMO
                </span>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-mono text-[11px] font-semibold text-slate-600">
                  {lead?.phone || "demo-aguardando"}
                </span>
                <span>·</span>
                <span>Origem: {lead?.adSource || "Demo"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Classificação:</span>
            <StatusBadge status={lead?.status || "aguardando_conta"} />
          </div>
        </div>

        {/* Grade de Qualificação ao Vivo */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Cidade */}
          <div className="flex flex-col gap-1 rounded-2xl bg-slate-50/80 p-3.5 ring-1 ring-inset ring-slate-200/60 transition">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <MapPin className="size-4 text-blue-600" />
              <span>Cidade</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {temCidade ? lead?.city : <span className="text-slate-400 font-normal italic">Pendente...</span>}
            </p>
            <span className="text-[11px] text-slate-400">Região de instalação</span>
          </div>

          {/* Conta Média */}
          <div className="flex flex-col gap-1 rounded-2xl bg-slate-50/80 p-3.5 ring-1 ring-inset ring-slate-200/60 transition">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Wallet className="size-4 text-emerald-600" />
              <span>Conta Média</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {temConta ? (
                formatCurrency(lead!.billValue) + "/mês"
              ) : (
                <span className="text-slate-400 font-normal italic">Pendente...</span>
              )}
            </p>
            <span className="text-[11px] text-slate-400">
              {temConta && lead!.billValue >= 600
                ? "Qualificado para Quente (≥ R$ 600)"
                : "Consumo mensal informado"}
            </span>
          </div>

          {/* Tipo de Imóvel */}
          <div className="flex flex-col gap-1 rounded-2xl bg-slate-50/80 p-3.5 ring-1 ring-inset ring-slate-200/60 transition">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Home className="size-4 text-indigo-600" />
              <span>Tipo de Imóvel</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {temTipo && lead?.propertyType ? (
                lead.propertyType
              ) : (
                <span className="text-slate-400 font-normal italic">Pendente...</span>
              )}
            </p>
            <span className="text-[11px] text-slate-400">Perfil de consumo</span>
          </div>

          {/* Imóvel Próprio */}
          <div className="flex flex-col gap-1 rounded-2xl bg-slate-50/80 p-3.5 ring-1 ring-inset ring-slate-200/60 transition">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Building className="size-4 text-amber-600" />
              <span>Imóvel Próprio</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {temProprio ? (
                lead?.ownProperty ? (
                  <span className="text-emerald-700">Sim, próprio</span>
                ) : (
                  <span className="text-amber-700">Alugado</span>
                )
              ) : (
                <span className="text-slate-400 font-normal italic">Pendente...</span>
              )}
            </p>
            <span className="text-[11px] text-slate-400">Fator para lead Quente</span>
          </div>

          {/* Interesse em Financiamento */}
          <div className="flex flex-col gap-1 rounded-2xl bg-slate-50/80 p-3.5 ring-1 ring-inset ring-slate-200/60 transition">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Coins className="size-4 text-cyan-600" />
              <span>Financiamento</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {temFinanc ? (
                lead?.wantsFinancing ? (
                  "Sim, tem interesse"
                ) : (
                  "Prefere à vista"
                )
              ) : (
                <span className="text-slate-400 font-normal italic">Pendente...</span>
              )}
            </p>
            <span className="text-[11px] text-slate-400">Previsão de pagamento</span>
          </div>

          {/* Foto da Conta */}
          <div className="flex flex-col gap-1 rounded-2xl bg-slate-50/80 p-3.5 ring-1 ring-inset ring-slate-200/60 transition">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <FileCheck2 className="size-4 text-teal-600" />
              <span>Foto da Conta</span>
            </div>
            <p className="mt-1 text-sm font-bold">
              {temFoto ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="size-4" /> Enviada com sucesso
                </span>
              ) : recusouFoto ? (
                <span className="text-amber-700">Recusou envio</span>
              ) : (
                <span className="text-slate-400 font-normal italic">Aguardando envio...</span>
              )}
            </p>
            <span className="text-[11px] text-slate-400">Última etapa da qualificação</span>
          </div>
        </div>

        {/* Destaque Financeiro: Economia Estimada & Atendimento */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Economia Estimada */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 p-4 ring-1 ring-inset ring-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">
                Economia Estimada (80% da conta)
              </span>
              <Zap className="size-4 text-emerald-600" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl">
              {temConta ? formatCurrency(economia) + "/mês" : "R$ 0,00"}
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              Calculada deterministicamente em código pela regra da empresa.
            </p>
          </div>

          {/* Modo de Atendimento Atual */}
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Status do Atendimento
              </span>
              <UserCheck className="size-4 text-blue-600" />
            </div>
            <p className="mt-2 text-base font-bold text-slate-900">
              {lead?.attendance === "humano" ? (
                <span className="text-amber-800 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Transferido para Atendimento Humano
                </span>
              ) : (
                <span className="text-blue-800 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                  Assistente IA Conduzindo
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {lead?.transferReason
                ? `Motivo do transbordo: "${lead.transferReason}"`
                : "A IA qualifica automaticamente até a foto ou pedido de consultor."}
            </p>
          </div>
        </div>

        {/* Rodapé explicativo sobre o isolamento do lead */}
        <div className="mt-5 rounded-2xl bg-blue-50/60 p-3.5 text-xs leading-relaxed text-blue-900 ring-1 ring-inset ring-blue-100 flex items-start gap-2.5">
          <Sparkles className="size-4 shrink-0 text-blue-600 mt-0.5" />
          <div>
            <span className="font-semibold">Isolamento garantido:</span> Este lead está marcado com <code className="font-mono font-bold text-blue-700">demo = true</code>. Ele aparece no painel de leads com o selo DEMO e é 100% excluído dos gráficos de métricas e do funil de vendas.
          </div>
        </div>
      </div>
    </div>
  );
}
