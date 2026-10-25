"use client";

import { useState, useTransition } from "react";
import {
  Bot,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  MessageSquare,
  Percent,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { salvarConfiguracoesSistemaAction } from "@/app/actions";
import type { SystemConfig } from "@/lib/config-helper";

export function PainelAutomacoesConfig({
  configInicial,
}: {
  configInicial: SystemConfig;
}) {
  const [config, setConfig] = useState<SystemConfig>(configInicial);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    tipo: "sucesso" | "erro";
    mensagem: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await salvarConfiguracoesSistemaAction(formData);
      if (res.success) {
        setFeedback({
          tipo: "sucesso",
          mensagem: "Configurações salvas e ativadas com sucesso! 🎉",
        });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({
          tipo: "erro",
          mensagem: res.error || "Erro ao salvar alterações.",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {/* CABEÇALHO DA SEÇÃO */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-600/20">
              <Zap className="size-4" />
            </span>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Personalização do Painel & Regras da IA
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Ativo em Produção
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Ajuste nomes, mensagens da IA, cálculos de economia e automações sem
            precisar encostar em nenhum código.
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-4 text-sm font-medium transition ${
            feedback.tipo === "sucesso"
              ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20"
              : "bg-red-50 text-red-800 ring-1 ring-red-600/20"
          }`}
        >
          {feedback.tipo === "sucesso" ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          ) : (
            <ShieldCheck className="size-5 shrink-0 text-red-600" />
          )}
          <span>{feedback.mensagem}</span>
        </div>
      )}

      {/* GRID COM OS CARDS DE CONFIGURAÇÃO */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* CARD 1: DADOS DA EMPRESA & ATENDENTE */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="size-4 text-slate-500" />
            <h3 className="font-display text-sm font-bold text-slate-800">
              Identidade da Empresa & Consultor
            </h3>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="nomeEmpresa"
                className="block text-xs font-semibold text-slate-700"
              >
                Nome da Empresa
              </label>
              <div className="relative mt-1">
                <input
                  id="nomeEmpresa"
                  name="nomeEmpresa"
                  type="text"
                  defaultValue={config.nomeEmpresa}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Aparece no topo do CRM e nas saudações da IA.
              </p>
            </div>

            <div>
              <label
                htmlFor="nomeConsultor"
                className="block text-xs font-semibold text-slate-700"
              >
                Nome do Consultor Responsável
              </label>
              <div className="relative mt-1">
                <input
                  id="nomeConsultor"
                  name="nomeConsultor"
                  type="text"
                  defaultValue={config.nomeConsultor}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Nome do atendente exibido no perfil e nos chats.
              </p>
            </div>

            <div>
              <label
                htmlFor="telefoneNotificacao"
                className="block text-xs font-semibold text-slate-700"
              >
                WhatsApp para Notificações Internas
              </label>
              <div className="relative mt-1">
                <input
                  id="telefoneNotificacao"
                  name="telefoneNotificacao"
                  type="text"
                  defaultValue={config.telefoneNotificacao}
                  placeholder="5586994127788"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm font-mono text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Número onde o consultor/dono recebe alertas de leads quentes.
              </p>
            </div>
          </div>
        </div>

        {/* CARD 2: CÁLCULOS & PARÂMETROS COMERCIAIS */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calculator className="size-4 text-slate-500" />
            <h3 className="font-display text-sm font-bold text-slate-800">
              Cálculos da Simulação Solar
            </h3>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="percentualEconomia"
                className="block text-xs font-semibold text-slate-700"
              >
                % de Economia Estimada Prometida
              </label>
              <div className="relative mt-1 flex items-center">
                <input
                  id="percentualEconomia"
                  name="percentualEconomia"
                  type="number"
                  step="0.5"
                  min="50"
                  max="99"
                  defaultValue={config.percentualEconomia}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 pr-9 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  required
                />
                <span className="pointer-events-none absolute right-3 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Exemplo: 92% calcula que uma conta de R$ 1.000 gera R$ 920 de
                economia.
              </p>
            </div>

            <div>
              <label
                htmlFor="multiplicadorProposta"
                className="block text-xs font-semibold text-slate-700"
              >
                Multiplicador do Valor da Proposta
              </label>
              <div className="relative mt-1 flex items-center">
                <input
                  id="multiplicadorProposta"
                  name="multiplicadorProposta"
                  type="number"
                  step="0.5"
                  min="10"
                  max="50"
                  defaultValue={config.multiplicadorProposta}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 pr-9 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  required
                />
                <span className="pointer-events-none absolute right-3 text-xs font-bold text-slate-400">
                  x
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Exemplo: 25x calcula que uma conta de R$ 500 gera uma proposta de
                R$ 12.500 no funil.
              </p>
            </div>

            <div>
              <label
                htmlFor="valorMinimoLeadQuente"
                className="block text-xs font-semibold text-slate-700"
              >
                Conta Mínima para Lead Quente (R$)
              </label>
              <div className="relative mt-1 flex items-center">
                <span className="pointer-events-none absolute left-3 text-xs font-bold text-slate-400">
                  R$
                </span>
                <input
                  id="valorMinimoLeadQuente"
                  name="valorMinimoLeadQuente"
                  type="number"
                  step="50"
                  min="100"
                  max="5000"
                  defaultValue={config.valorMinimoLeadQuente}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Contas iguais ou superiores a este valor recebem o selo de Lead
                Quente 🔥.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: CHAVES DE AUTOMAÇÃO (TOGGLES LIGA/DESLIGA) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Bot className="size-4 text-slate-500" />
          <h3 className="font-display text-sm font-bold text-slate-800">
            Regras de Automação da IA
          </h3>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Toggle 1: IA responde 24h */}
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 transition hover:bg-slate-50">
            <div>
              <span className="block text-xs font-bold text-slate-800">
                Atendimento da IA 24 horas por dia
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                Qualifica clientes imediatamente, inclusive aos fins de semana e
                madrugadas.
              </span>
            </div>
            <input
              type="checkbox"
              name="iaAtiva24h"
              defaultChecked={config.iaAtiva24h}
              className="mt-0.5 size-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>

          {/* Toggle 2: Pausar IA no atendimento humano */}
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 transition hover:bg-slate-50">
            <div>
              <span className="block text-xs font-bold text-slate-800">
                Pausar IA quando humano responder
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                Impede que a IA continue enviando botões automáticos enquanto o
                consultor fala.
              </span>
            </div>
            <input
              type="checkbox"
              name="pausarIaQuandoHumano"
              defaultChecked={config.pausarIaQuandoHumano}
              className="mt-0.5 size-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>

          {/* Toggle 3: Pedir foto da conta */}
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 transition hover:bg-slate-50">
            <div>
              <span className="block text-xs font-bold text-slate-800">
                Pedir foto do talão de energia
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                Solicita a foto da conta de luz após simulação para o engenheiro
                analisar o padrão.
              </span>
            </div>
            <input
              type="checkbox"
              name="pedirFotoConta"
              defaultChecked={config.pedirFotoConta}
              className="mt-0.5 size-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>

          {/* Toggle 4: Notificar lead quente */}
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 transition hover:bg-slate-50">
            <div>
              <span className="block text-xs font-bold text-slate-800">
                Avisar consultor sobre Lead Quente
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                Dá prioridade visual e emite alerta quando o lead atinge a conta
                mínima qualificada.
              </span>
            </div>
            <input
              type="checkbox"
              name="notificarLeadQuente"
              defaultChecked={config.notificarLeadQuente}
              className="mt-0.5 size-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* CARD 4: MENSAGENS PERSONALIZADAS DA IA */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <MessageSquare className="size-4 text-slate-500" />
          <h3 className="font-display text-sm font-bold text-slate-800">
            Mensagens do Roteiro no WhatsApp
          </h3>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {/* Mensagem Inicial */}
          <div>
            <label
              htmlFor="msgBoasVindas"
              className="block text-xs font-semibold text-slate-700"
            >
              Mensagem de Boas-vindas (Pergunta 1 - Origem)
            </label>
            <textarea
              id="msgBoasVindas"
              name="msgBoasVindas"
              rows={4}
              defaultValue={config.msgBoasVindas}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              required
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Primeira mensagem enviada pela IA junto aos botões interativos de
              origem.
            </p>
          </div>

          {/* Mensagem Final */}
          <div>
            <label
              htmlFor="msgConclusao"
              className="block text-xs font-semibold text-slate-700"
            >
              Mensagem de Conclusão e Transferência para o Consultor
            </label>
            <textarea
              id="msgConclusao"
              name="msgConclusao"
              rows={4}
              defaultValue={config.msgConclusao}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              required
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Mensagem enviada após a qualificação completa, antes do consultor
              assumir.
            </p>
          </div>
        </div>
      </div>

      {/* BOTÃO FIXO/FINAL DE SALVAR */}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Salvando no banco de dados...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>
    </form>
  );
}
