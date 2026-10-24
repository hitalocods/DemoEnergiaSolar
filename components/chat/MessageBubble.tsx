import { AlertCircle, Bot, Check, CheckCheck, Clock, FileImage, UserRound } from "lucide-react";
import type { Message } from "@/lib/types";
import { cn, formatTime, stripRefCode } from "@/lib/utils";

/**
 * Bolha de mensagem estilo WhatsApp.
 * Lead à esquerda; IA e atendente humano à direita (lado da empresa).
 */
export function MessageBubble({ message, leadName }: { message: Message; leadName: string }) {
  const fromLead = message.from === "lead";
  const fromIA = message.from === "ia";

  return (
    <div className={cn("flex animate-pop items-end gap-2", fromLead ? "justify-start" : "justify-end")}>
      {fromLead && (
        <span className="mb-1 hidden size-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500 sm:flex">
          <UserRound className="size-3.5" />
        </span>
      )}

      <div
        className={cn(
          "relative max-w-[85%] rounded-2xl px-3.5 pb-1.5 pt-2 text-[14px] leading-relaxed shadow-[0_1px_1px_rgb(15_23_42/0.06)] sm:max-w-[72%]",
          fromLead && "rounded-bl-md bg-white text-slate-800",
          fromIA && "rounded-br-md bg-blue-50 text-slate-800 ring-1 ring-inset ring-blue-100",
          message.from === "humano" && "rounded-br-md bg-[#dcfce7] text-slate-800 ring-1 ring-inset ring-green-200/70",
        )}
      >
        <p
          className={cn(
            "mb-0.5 text-[11px] font-bold",
            fromLead ? "text-slate-500" : fromIA ? "text-blue-700" : "text-green-700",
          )}
        >
          {fromLead ? leadName.split(" ")[0] : fromIA ? "Assistente IA" : "Você"}
        </p>

        {message.attachment && (
          <div className="mb-2 mt-1 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-inset ring-slate-200">
            {message.attachment.url ? (
              <a
                href={message.attachment.url}
                target="_blank"
                rel="noreferrer"
                className="block max-h-60 overflow-hidden bg-black/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={message.attachment.url}
                  alt={message.attachment.label || "Foto da conta"}
                  className="max-h-60 w-full object-contain transition hover:opacity-95"
                />
              </a>
            ) : null}
            <div className="flex items-center gap-2.5 p-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                <FileImage className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-slate-700">
                  {message.attachment.label}
                </p>
                <p className="text-[10px] text-slate-500">Foto da conta de luz</p>
              </div>
            </div>
          </div>
        )}

        <p className="whitespace-pre-wrap break-words">{stripRefCode(message.text)}</p>

        {message.statusEntrega === "failed" && (
          <div className="mt-1 flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 ring-1 ring-inset ring-red-200">
            <AlertCircle className="size-3 shrink-0" />
            <span className="truncate" title={message.erroEntrega || "Erro na entrega Meta"}>
              {message.erroEntrega ? `Falha: ${message.erroEntrega}` : "Falha na entrega Meta"}
            </span>
          </div>
        )}

        <span className="mt-0.5 flex items-center justify-end gap-1 text-[10.5px] text-slate-400 tabular">
          {formatTime(message.createdAt)}
          {!fromLead && (
            <>
              {message.statusEntrega === "failed" ? (
                <span title="Falha no envio">
                  <AlertCircle className="size-3 text-red-500" />
                </span>
              ) : message.statusEntrega === "read" ? (
                <span title="Lido">
                  <CheckCheck className="size-3.5 text-blue-500" />
                </span>
              ) : message.statusEntrega === "delivered" ? (
                <span title="Entregue">
                  <CheckCheck className="size-3.5 text-slate-400" />
                </span>
              ) : message.statusEntrega === "sent" ? (
                <span title="Enviado">
                  <Check className="size-3.5 text-slate-400" />
                </span>
              ) : (
                <span title="Aguardando envio">
                  <Clock className="size-3 text-slate-400" />
                </span>
              )}
            </>
          )}
        </span>
      </div>

      {fromIA && (
        <span className="mb-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm">
          <Bot className="size-3.5" />
        </span>
      )}
      {message.from === "humano" && (
        <span className="mb-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-whats text-[10px] font-bold text-white shadow-sm">
          RN
        </span>
      )}
    </div>
  );
}
