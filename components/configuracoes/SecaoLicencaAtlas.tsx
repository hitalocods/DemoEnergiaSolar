"use client";

import {
  ShieldCheck,
  Zap,
  Server,
  Cpu,
  Clock,
  ExternalLink,
  Lock,
} from "lucide-react";

export function SecaoLicencaAtlas() {
  const linkPagamento =
    "https://app.abacatepay.com/pay/bill_BuCX2kKgcuHUNuHrBB0pgAFq";

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-4 sm:p-5 text-white shadow-lg shadow-slate-950/30 relative overflow-hidden">
      {/* Luz ambiente de fundo sutil */}
      <div className="absolute -right-16 -top-16 size-48 rounded-full bg-blue-600/15 blur-2xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 size-48 rounded-full bg-emerald-600/10 blur-2xl pointer-events-none" />

      {/* CABEÇALHO COMPACTO + BOTÃO ASSINAR JÁ NO TOPO */}
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-white">
                Licença Atlas Software · Sistema & IA
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
                Ativa
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              EBS Engenharia · <span className="font-bold text-emerald-400 text-xs">R$ 100/mês</span>
            </p>
          </div>
        </div>

        {/* BOTÃO DE ASSINAR EM DESTAQUE LOGO NO TOPO */}
        <div className="w-full sm:w-auto">
          <a
            href={linkPagamento}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-emerald-600 to-teal-500 hover:from-blue-500 hover:to-emerald-400 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {/* Halo pulsante suave */}
            <span className="absolute -inset-0.5 -z-10 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 opacity-50 blur-[2px] animate-pulse" />
            
            {/* Ponto de luz pulsando */}
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-white" />
            </span>

            <span>Assinar Licença / Pagar</span>
            <ExternalLink className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>

      {/* RECURSOS EM LINHA COMPACTA (MENOS ESPAÇO NO CELULAR) */}
      <div className="relative z-10 mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-left">
        <div className="rounded-xl border border-slate-800/80 bg-slate-800/25 p-2.5">
          <div className="flex items-center gap-1.5 text-blue-400 mb-1">
            <Server className="size-3.5 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 truncate">Locação</span>
          </div>
          <p className="text-xs font-semibold text-white truncate">Cloud Server 24h</p>
          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">Neon Postgres & CDN Vercel dedicada.</p>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-800/25 p-2.5">
          <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
            <Zap className="size-3.5 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 truncate">WhatsApp Cloud</span>
          </div>
          <p className="text-xs font-semibold text-white truncate">API Oficial Meta</p>
          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">Webhooks em tempo real e botões interativos.</p>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-800/25 p-2.5">
          <div className="flex items-center gap-1.5 text-purple-400 mb-1">
            <Cpu className="size-3.5 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 truncate">Agente IA</span>
          </div>
          <p className="text-xs font-semibold text-white truncate">Motor 6 Etapas</p>
          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">Qualificação solar e cálculo de economia.</p>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-800/25 p-2.5">
          <div className="flex items-center gap-1.5 text-amber-400 mb-1">
            <Clock className="size-3.5 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 truncate">Manutenção</span>
          </div>
          <p className="text-xs font-semibold text-white truncate">Backup & Suporte</p>
          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">Rotina de backup automático de leads.</p>
        </div>
      </div>

      {/* STATUS DISCRETO NO RODAPÉ */}
      <div className="relative z-10 mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <Lock className="size-3 text-slate-500" /> Cobrança via AbacatePay
        </span>
        <span className="text-slate-500">Atlas Software</span>
      </div>
    </div>
  );
}
