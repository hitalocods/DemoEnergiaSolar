"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  Loader2,
  Paperclip,
  SendHorizontal,
  Smile,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const QUICK_REPLIES = [
  "Oi! Aqui é o Rafael, consultor da EBS Energia Solar 😊",
  "Posso te ligar agora para explicar a proposta?",
  "Vou preparar sua simulação e te mando ainda hoje.",
];

/**
 * Campo de digitação. Desabilitado enquanto a IA está atendendo:
 * nesse caso mostra o aviso e o atalho para assumir.
 * Exibe erro de validação (ex: janela de 24h da Meta expirada).
 */
export function ChatComposer({
  enabled,
  onSend,
  onAssumir,
  assuming,
}: {
  enabled: boolean;
  onSend: (text: string) => Promise<void>;
  onAssumir: () => void;
  assuming: boolean;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function submit(value = text) {
    const trimmed = value.trim();
    if (!trimmed || !enabled || sending) return;
    setSending(true);
    setErrorMsg(null);
    try {
      await onSend(trimmed);
      setText("");
      inputRef.current?.focus();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao enviar mensagem";
      setErrorMsg(message);
    } finally {
      setSending(false);
    }
  }

  if (!enabled) {
    return (
      <div className="border-t border-slate-200/70 bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-3 rounded-2xl bg-blue-50/80 p-3 ring-1 ring-inset ring-blue-100 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3">
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
              <Bot className="size-4" />
              <span className="absolute -right-0.5 -top-0.5 size-2.5 animate-pulse rounded-full bg-emerald-400 ring-2 ring-blue-50" />
            </span>
            <div>
              <p className="text-sm font-bold text-blue-900">A IA está atendendo</p>
              <p className="text-xs text-blue-800/70">
                Assuma a conversa para digitar. A IA será pausada.
              </p>
            </div>
          </div>
          <Button
            id="composer-assumir"
            size="sm"
            onClick={onAssumir}
            disabled={assuming}
          >
            {assuming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserCheck className="size-4" />
            )}
            Assumir atendimento
          </Button>
        </div>
        <div
          aria-hidden
          className="mt-3 flex h-11 items-center rounded-xl bg-slate-100 px-4 text-sm text-slate-400"
        >
          Campo desabilitado enquanto a IA atende…
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200/70 bg-white p-3 sm:p-4">
      {errorMsg && (
        <div className="mb-2.5 flex items-center justify-between rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200 animate-pop">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="ml-2 text-red-500 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      )}

      <div className="no-scrollbar -mx-1 mb-2.5 flex gap-2 overflow-x-auto px-1">
        {QUICK_REPLIES.map((reply) => (
          <button
            key={reply}
            type="button"
            onClick={() => submit(reply)}
            className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-blue-50 hover:text-brand"
          >
            {reply}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-end gap-2"
      >
        <div className="flex flex-1 items-end rounded-2xl border border-slate-200 bg-white transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100">
          <button
            type="button"
            aria-label="Emoji"
            className="p-3 text-slate-400 hover:text-slate-600"
          >
            <Smile className="size-5" />
          </button>
          <textarea
            id="campo-mensagem"
            ref={inputRef}
            rows={1}
            value={text}
            autoFocus
            onChange={(e) => {
              setText(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Digite sua mensagem…"
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent py-3 text-sm outline-none [field-sizing:content] placeholder:text-slate-400"
          />
          <button
            type="button"
            aria-label="Anexar"
            className="p-3 text-slate-400 hover:text-slate-600"
          >
            <Paperclip className="size-5" />
          </button>
        </div>
        <button
          id="enviar-mensagem"
          type="submit"
          aria-label="Enviar mensagem"
          disabled={!text.trim() || sending}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full text-white transition-all",
            text.trim()
              ? "bg-whats shadow-[0_6px_16px_-6px_rgb(22_163_74/0.7)] hover:bg-green-700 active:scale-95"
              : "bg-slate-300"
          )}
        >
          {sending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <SendHorizontal className="size-5" />
          )}
        </button>
      </form>
    </div>
  );
}
