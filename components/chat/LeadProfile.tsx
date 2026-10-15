import {
  Banknote,
  Building2,
  Home,
  KeyRound,
  Megaphone,
  MapPin,
  Phone,
  Sparkles,
  Target,
  Wallet,
  X,
} from "lucide-react";
import type { Lead } from "@/lib/types";
import { cn, formatCurrency, formatPhone, STAGE_META, yesNo } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";

/** Painel "Perfil do Lead" (coluna direita / drawer no mobile). */
export function LeadProfile({ lead, onClose }: { lead: Lead; onClose?: () => void }) {
  // Estimativa simples: ~90% de economia na conta.
  const savings = Math.round(lead.billValue * 0.9);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5">
        <h2 className="font-display text-base font-bold text-slate-900">Perfil do Lead</h2>
        {onClose && (
          <button onClick={onClose} aria-label="Fechar perfil" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        )}
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-5 pb-5">
        <div className="mt-4 flex flex-col items-center rounded-2xl bg-gradient-to-b from-slate-50 to-white px-4 py-5 text-center ring-1 ring-inset ring-slate-100">
          <Avatar name={lead.name} size="lg" />
          <p className="mt-3 font-display text-lg font-bold text-slate-900">{lead.name}</p>
          <p className="text-sm text-slate-500 tabular">{formatPhone(lead.phone)}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <StatusBadge status={lead.status} />
            {lead.stage && (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  STAGE_META[lead.stage].soft,
                  STAGE_META[lead.stage].text,
                )}
              >
                {STAGE_META[lead.stage].label}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-4 text-white shadow-[0_10px_30px_-12px_rgb(29_78_216/0.7)]">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-100">
            <Sparkles className="size-3.5" /> Economia estimada
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold tabular">
            {formatCurrency(savings)}
            <span className="text-sm font-semibold text-blue-200">/mês</span>
          </p>
          {lead.proposalValue && (
            <p className="mt-1 text-xs text-blue-100">
              Sistema estimado em <strong className="text-white">{formatCurrency(lead.proposalValue)}</strong>
            </p>
          )}
        </div>

        <dl className="mt-4 divide-y divide-slate-100">
          <Row icon={<Phone />} label="Telefone" value={formatPhone(lead.phone)} />
          <Row icon={<Wallet />} label="Conta média" value={formatCurrency(lead.billValue)} strong />
          <Row icon={<MapPin />} label="Cidade" value={`${lead.city} - ${lead.state}`} />
          <Row icon={lead.propertyType === "Residencial" ? <Home /> : <Building2 />} label="Perfil" value={lead.propertyType} />
          <Row icon={<KeyRound />} label="Imóvel próprio" value={yesNo(lead.ownProperty, "Sim, próprio", "Não, alugado")} />
          <Row icon={<Banknote />} label="Financiamento" value={yesNo(lead.wantsFinancing, "Tem interesse", "À vista")} />
          <Row icon={<Megaphone />} label="Origem do anúncio" value={lead.adSource} />
          <Row icon={<Target />} label="Interesse" value={lead.interest} />
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="text-[13px] text-slate-500">Status</dt>
            <dd className="text-right text-[13px] font-semibold">
              {lead.attendance === "humano" ? (
                lead.assignedTo ? (
                  <span className="text-green-700">Humano · {lead.assignedTo}</span>
                ) : (
                  <span className="text-amber-700">Aguardando consultor</span>
                )
              ) : (
                <span className="text-blue-700">Com a IA</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function Row({ icon, label, value, strong }: { icon: React.ReactElement; label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 [&>svg]:size-3.5">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[12px] text-slate-500">{label}</dt>
        <dd className={cn("text-[13.5px] leading-snug", strong ? "font-bold text-slate-900" : "font-semibold text-slate-700")}>
          {value}
        </dd>
      </div>
    </div>
  );
}
