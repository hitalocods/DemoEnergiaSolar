"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { loginAction } from "@/app/actions";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";

/** Login real com email e senha validados no Neon Postgres */
export function LoginForm() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await loginAction(null, formData);
      if (res?.error) {
        setErrorMessage(res.error);
        setLoading(false);
      }
    } catch {
      // Quando redirect é executado pelo Server Action em Next.js, uma exceção NEXT_REDIRECT é lançada
      // e tratada nativamente pelo framework.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm animate-fade-up">
      <div className="mb-10 lg:hidden">
        <Logo tone="dark" />
      </div>

      <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
        Bem-vindo de volta
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Entre para acompanhar os leads que a IA está qualificando agora.
      </p>

      {errorMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
          <AlertCircle className="size-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      <div className="mt-8 space-y-4">
        <Field label="Senha de acesso" icon={<Lock className="size-4" />}>
          <input
            id="login-senha"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Digite sua senha de acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-slate-700"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </Field>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" defaultChecked className="size-4 rounded accent-brand" />
          Manter conectado
        </label>
      </div>

      <Button
        id="login-entrar"
        type="submit"
        className="mt-8 h-12 w-full text-[15px]"
        disabled={loading}
      >
        {loading ? "Entrando…" : "Entrar no painel"}
        {!loading && <ArrowRight className="size-4" />}
      </Button>

      <p className="mt-6 text-center text-xs text-slate-400">
        Digite sua senha cadastrada para acessar o painel da EBS Energia Solar.
      </p>
    </form>
  );
}

function Field({
  label,
  icon,
  trailing,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {trailing}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

/** Painel ilustrativo do lado direito do login (desktop). */
export function LoginShowcase() {
  return (
    <div className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12">
      {/* Sol / brilho */}
      <div className="pointer-events-none absolute -right-32 -top-32 size-[520px] rounded-full bg-[radial-gradient(circle,rgb(251_191_36/0.35),transparent_62%)]" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 size-[480px] rounded-full bg-[radial-gradient(circle,rgb(29_78_216/0.45),transparent_65%)]" />
      {/* Grade de painéis solares */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-[0.18] [mask-image:linear-gradient(to_top,black,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(147 197 253) 1px, transparent 1px), linear-gradient(90deg, rgb(147 197 253) 1px, transparent 1px)",
          backgroundSize: "56px 36px",
          transform: "perspective(600px) rotateX(55deg)",
          transformOrigin: "bottom",
        }}
      />

      <Logo className="relative" />

      <div className="relative max-w-md">
        <h2 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white">
          Cada lead do anúncio, <span className="text-amber-300">atendido em segundos.</span>
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-400">
          A IA conversa no WhatsApp, coleta a conta de luz e entrega o lead quente para o seu time fechar.
        </p>
      </div>

      <div className="relative grid grid-cols-3 gap-3">
        <ShowcaseStat icon={<Bot className="size-4" />} value="95%" label="respondidos pela IA" />
        <ShowcaseStat icon={<MessageCircle className="size-4" />} value="38s" label="1ª resposta média" />
        <ShowcaseStat icon={<TrendingUp className="size-4" />} value="+20%" label="vendas no mês" />
      </div>
    </div>
  );
}

function ShowcaseStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10 backdrop-blur">
      <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
        {icon}
      </span>
      <p className="mt-3 font-display text-2xl font-extrabold text-white tabular">
        {value}
      </p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
