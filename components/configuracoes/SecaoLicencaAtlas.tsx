"use client";

import {
  ShieldCheck,
  Zap,
  Server,
  Cpu,
  Clock,
  ExternalLink,
  Receipt,
  AlertCircle,
  Sparkles,
  Lock,
  Layers,
  ChevronRight,
} from "lucide-react";

export function SecaoLicencaAtlas() {
  const linkPagamento =
    "https://app.abacatepay.com/pay/bill_BuCX2kKgcuHUNuHrBB0pgAFq";

  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/40 relative overflow-hidden">
      {/* Luz ambiente de fundo */}
      <div className="absolute -right-20 -top-20 size-72 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 size-72 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

      {/* CABEÇALHO */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight text-white">
                  Licença Atlas Software · Sistema & IA
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Servidores Ativos
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Plano Dedicado EBS Engenharia e Energia Solar · ID Contrato: <span className="font-mono text-slate-300">ATL-EBS-2026-X9</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-2 bg-slate-800/60 border border-slate-700/60 rounded-2xl px-4 py-2 self-start sm:self-auto">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Mensalidade:</span>
          <span className="text-2xl font-black text-emerald-400">R$ 100<span className="text-sm font-medium text-slate-300">,00</span></span>
          <span className="text-xs text-slate-400">/mês</span>
        </div>
      </div>

      {/* GRID DE RECURSOS E SERVIÇOS INCLUSOS */}
      <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-800/30 p-4 transition hover:border-slate-700">
          <div className="flex items-center gap-2.5 text-blue-400 mb-2">
            <Server className="size-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Locação do Sistema</span>
          </div>
          <p className="text-sm font-semibold text-white">Cloud Server Dedicado 24h</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Painel de controle, banco de dados Neon Postgres com alta disponibilidade e CDN Vercel.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-800/30 p-4 transition hover:border-slate-700">
          <div className="flex items-center gap-2.5 text-emerald-400 mb-2">
            <Zap className="size-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">API WhatsApp Cloud</span>
          </div>
          <p className="text-sm font-semibold text-white">Conexão Oficial Meta</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Canal verificado, webhooks em tempo real, envio de botões interativos e tráfego criptografado.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-800/30 p-4 transition hover:border-slate-700">
          <div className="flex items-center gap-2.5 text-purple-400 mb-2">
            <Cpu className="size-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Agente IA de Qualificação</span>
          </div>
          <p className="text-sm font-semibold text-white">Motor 6 Etapas Solar</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Cálculo de economia automática, triagem de faturas de energia e repasse automático ao consultor.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-800/30 p-4 transition hover:border-slate-700">
          <div className="flex items-center gap-2.5 text-amber-400 mb-2">
            <Clock className="size-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Manutenção & Backup</span>
          </div>
          <p className="text-sm font-semibold text-white">Suporte & Atualizações</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Rotina de backup automático de conversas, monitoramento de saúde do webhook e suporte técnico.
          </p>
        </div>
      </div>

      {/* STATUS DO CICLO & BOTÃO DE FATURAMENTO */}
      <div className="relative z-10 mt-6 flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-800/40 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            <Receipt className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Status da Assinatura:</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Regular / Ativa
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Assinatura recorrente mensal gerenciada via <span className="font-semibold text-white">AbacatePay</span>.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <a
            href={linkPagamento}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Gerenciar / Pagar Assinatura</span>
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>

      {/* RODAPÉ DO CONTRATO */}
      <div className="relative z-10 mt-4 flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span className="flex items-center gap-1">
          <Lock className="size-3" /> Conexão protegida por criptografia de ponta a ponta
        </span>
        <span>Fornecido por Atlas Software Tecnologia LTDA</span>
      </div>
    </div>
  );
}
