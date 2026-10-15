"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Camera,
  CheckCheck,
  FileImage,
  Send,
  Sparkles,
} from "lucide-react";
import type { Message } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";

interface PhoneMockupProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (texto: string, file?: File) => Promise<void>;
  disabled?: boolean;
}

const QUICK_SUGGESTIONS = [
  "Oi, vi o anúncio",
  "Teresina",
  "R$ 950",
  "Residencial",
  "Próprio",
  "Tenho interesse",
  "Não tenho a conta aqui agora",
  "Quero falar com uma pessoa",
];

export function PhoneMockup({
  messages,
  isTyping,
  onSendMessage,
  disabled = false,
}: PhoneMockupProps) {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rola até o final ao receber novas mensagens ou ao digitar
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isTyping]);

  async function handleSend() {
    const txt = inputText.trim();
    if (!txt || isSending || disabled) return;

    setInputText("");
    setIsSending(true);
    try {
      await onSendMessage(txt);
    } finally {
      setIsSending(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || isSending || disabled) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Formato de arquivo não suportado. Por favor, envie uma imagem JPEG, PNG ou WebP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem selecionada ultrapassa o limite de 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsSending(true);
    try {
      await onSendMessage("", file);
    } finally {
      setIsSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Moldura de Celular Smartphone Premium */}
      <div className="relative w-full max-w-[390px] rounded-[48px] bg-slate-900 p-3.5 shadow-2xl ring-1 ring-white/20">
        {/* Botões laterais simulados */}
        <div className="absolute -left-1 top-24 h-10 w-1 rounded-l bg-slate-700" />
        <div className="absolute -left-1 top-38 h-12 w-1 rounded-l bg-slate-700" />
        <div className="absolute -right-1 top-28 h-16 w-1 rounded-r bg-slate-700" />

        {/* Dynamic Island / Notch no topo */}
        <div className="relative mx-auto mb-2 flex h-5 w-28 items-center justify-center rounded-full bg-black">
          <div className="size-2 rounded-full bg-slate-900/80" />
          <div className="ml-3 size-2.5 rounded-full bg-blue-950/60 ring-1 ring-blue-500/20" />
        </div>

        {/* Tela interna estilo WhatsApp */}
        <div className="flex h-[590px] flex-col overflow-hidden rounded-[36px] bg-[#efeae2] shadow-inner">
          {/* Cabeçalho WhatsApp */}
          <header className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white shadow-md">
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 ring-2 ring-emerald-300/40">
              <Bot className="size-5 text-white" />
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-[#075e54]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-sans text-sm font-bold tracking-tight text-white">
                SolarMais · Assistente
              </h3>
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-100">
                {isTyping ? (
                  <span className="animate-pulse text-emerald-200">digitando...</span>
                ) : (
                  <>
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    online
                  </>
                )}
              </p>
            </div>
          </header>

          {/* Área de Mensagens com scroll */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-2.5 overflow-y-auto p-3.5 scroll-smooth"
            style={{
              backgroundImage:
                "radial-gradient(#d1d7db 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {/* Aviso de criptografia simulado */}
            <div className="mx-auto my-1 max-w-[85%] rounded-lg bg-[#ffeecd] px-2.5 py-1 text-center text-[10px] leading-tight text-slate-700 shadow-[0_1px_1px_rgba(0,0,0,0.06)]">
              🔒 As mensagens são protegidas por criptografia de ponta a ponta simulada.
            </div>

            {messages.length === 0 && !isTyping && (
              <div className="my-8 text-center text-xs text-slate-500">
                Envie uma mensagem abaixo para iniciar a conversa com a IA.
              </div>
            )}

            {messages.map((m) => {
              const isLead = m.from === "lead";

              return (
                <div
                  key={m.id}
                  className={cn("flex items-end gap-1.5", isLead ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "relative max-w-[84%] rounded-2xl px-3 py-2 text-[13.5px] leading-relaxed shadow-[0_1px_1px_rgba(0,0,0,0.08)]",
                      isLead
                        ? "rounded-tr-xs bg-[#d9fdd3] text-slate-900"
                        : "rounded-tl-xs bg-white text-slate-900"
                    )}
                  >
                    {/* Anexo de Imagem se houver */}
                    {m.attachment && (
                      <div className="mb-2 overflow-hidden rounded-xl bg-black/5 ring-1 ring-black/10">
                        {m.attachment.url ? (
                          <a
                            href={m.attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block max-h-48 overflow-hidden"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={m.attachment.url}
                              alt={m.attachment.label || "Foto da conta"}
                              className="max-h-48 w-full object-cover transition hover:scale-105"
                            />
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 p-2.5">
                            <FileImage className="size-5 text-emerald-700" />
                            <span className="truncate text-xs font-semibold text-slate-700">
                              {m.attachment.label}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Texto da mensagem */}
                    {m.text && m.text !== "[imagem]" && (
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    )}

                    {/* Rodapé da bolha: hora e status de entrega */}
                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                      <span>{formatTime(m.createdAt)}</span>
                      {isLead && <CheckCheck className="size-3.5 text-blue-500" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Balão animado de digitando da IA */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs bg-white px-3.5 py-2.5 shadow-sm">
                  <span className="size-1.5 animate-bounce rounded-full bg-emerald-600 [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-emerald-600 [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-emerald-600" />
                </div>
              </div>
            )}
          </div>

          {/* Sugestões rápidas de mensagens em chips */}
          <div className="border-t border-slate-200/60 bg-[#f0f2f5] px-2.5 py-1.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
              <span className="flex shrink-0 items-center gap-1 text-[10.5px] font-semibold text-slate-500">
                <Sparkles className="size-3 text-amber-500" /> Teste:
              </span>
              {QUICK_SUGGESTIONS.map((sugestao) => (
                <button
                  key={sugestao}
                  type="button"
                  disabled={isSending || disabled}
                  onClick={() => {
                    setInputText(sugestao);
                  }}
                  className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-xs ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:opacity-50"
                >
                  {sugestao}
                </button>
              ))}
            </div>
          </div>

          {/* Barra de Input Inferior */}
          <footer className="flex items-center gap-2 bg-[#f0f2f5] p-2.5">
            {/* Input escondido para upload de foto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              aria-label="Anexar foto da conta"
              title="Anexar foto da conta"
              disabled={isSending || disabled}
              onClick={() => fileInputRef.current?.click()}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 active:scale-95 disabled:opacity-50"
            >
              <Camera className="size-5" />
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex flex-1 items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                disabled={isSending || disabled}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Mensagem"
                className="w-full rounded-full border-none bg-white px-4 py-2 text-sm text-slate-800 placeholder-slate-400 shadow-xs outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500"
              />

              <button
                type="submit"
                aria-label="Enviar mensagem"
                disabled={!inputText.trim() || isSending || disabled}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#128c7e] text-white shadow-sm transition hover:bg-[#075e54] active:scale-95 disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </footer>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Você está simulando o lead no WhatsApp interagindo com a assistente IA da SolarMais.
      </p>
    </div>
  );
}
