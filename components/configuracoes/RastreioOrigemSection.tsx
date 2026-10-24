"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Check,
  Copy,
  Download,
  Globe,
  Link as LinkIcon,
  Loader2,
  Plus,
  QrCode,
  Share2,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { criarCanalRastreioAction, getCanaisRastreioAction } from "@/app/actions";
import type { CanalRastreio, TipoCanalRastreio } from "@/lib/types";
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

const TIPO_INFO: Record<
  TipoCanalRastreio,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  instagram: {
    label: "Instagram",
    icon: InstagramIcon,
    color: "bg-pink-50 text-pink-700 ring-pink-600/20",
  },
  google_ads: {
    label: "Google Ads",
    icon: Globe,
    color: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  google_meu_negocio: {
    label: "Google Meu Negócio",
    icon: Store,
    color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  site: {
    label: "Site",
    icon: Globe,
    color: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  },
  qr: {
    label: "QR Code Físico",
    icon: QrCode,
    color: "bg-purple-50 text-purple-700 ring-purple-600/20",
  },
  outro: {
    label: "Outro Canal",
    icon: Share2,
    color: "bg-slate-100 text-slate-700 ring-slate-300",
  },
};

export function RastreioOrigemSection({
  whatsappNumero,
}: {
  whatsappNumero: string;
}) {
  const [canais, setCanais] = useState<CanalRastreio[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [qrModalCanal, setQrModalCanal] = useState<CanalRastreio | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const numLimpo = whatsappNumero.replace(/\D/g, "") || "5586994127788";

  useEffect(() => {
    void carregarCanais();
  }, []);

  async function carregarCanais() {
    try {
      const data = await getCanaisRastreioAction();
      setCanais(data);
    } catch (err) {
      console.error("Erro ao carregar canais:", err);
    } finally {
      setLoading(false);
    }
  }

  function getWaUrl(canal: CanalRastreio) {
    const texto = `${canal.mensagemPadrao} (ref: ${canal.codigo})`;
    return `https://wa.me/${numLimpo}?text=${encodeURIComponent(texto)}`;
  }

  async function handleCopiar(canal: CanalRastreio) {
    const url = getWaUrl(canal);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(canal.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {
      console.error("Falha ao copiar:", e);
    }
  }

  async function abrirQrCode(canal: CanalRastreio) {
    const url = getWaUrl(canal);
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 380,
        margin: 2,
        color: {
          dark: "#0b1220",
          light: "#ffffff",
        },
      });
      setQrDataUrl(dataUrl);
      setQrModalCanal(canal);
    } catch (err) {
      console.error("Erro ao gerar QR Code:", err);
    }
  }

  async function handleCriarCanal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await criarCanalRastreioAction(formData);
      if (res.success && res.canal) {
        setCanais((prev) => [res.canal!, ...prev]);
        setModalNovoAberto(false);
      }
    });
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-600/20">
              <Share2 className="size-4" />
            </span>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Rastreio de Origem dos Leads
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Crie links e QR Codes com códigos automáticos para saber exatamente
            de onde cada lead veio (Instagram, Google, Site ou Panfletos).
          </p>
        </div>

        <button
          onClick={() => setModalNovoAberto(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <Plus className="size-4" />
          Novo canal
        </button>
      </div>

      {loading ? (
        <div className="flex h-36 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-slate-400" />
        </div>
      ) : canais.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
          <p className="text-sm font-semibold text-slate-600">
            Nenhum canal cadastrado ainda.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Clique no botão acima para criar o primeiro link rastreável.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {canais.map((canal) => {
            const info = TIPO_INFO[canal.tipo] || TIPO_INFO.outro;
            const Icon = info.icon;
            const isCopied = copiedId === canal.id;

            return (
              <div
                key={canal.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                        info.color
                      )}
                    >
                      <Icon className="size-3.5" />
                      {info.label}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      ref: {canal.codigo}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-sm font-bold text-slate-900">
                    {canal.nome}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    &quot;{canal.mensagemPadrao}&quot;
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-slate-200/60 pt-3">
                  <button
                    onClick={() => handleCopiar(canal)}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ring-1 ring-inset",
                      isCopied
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                        : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {isCopied ? (
                      <>
                        <Check className="size-3.5 text-emerald-600" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        Copiar link
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => abrirQrCode(canal)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
                    title="Visualizar e baixar QR Code"
                  >
                    <QrCode className="size-3.5 text-slate-600" />
                    QR Code
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Novo Canal de Rastreio */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 animate-fade-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Novo Canal de Rastreio
              </h3>
              <button
                onClick={() => setModalNovoAberto(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCriarCanal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Nome do Canal
                </label>
                <input
                  name="nome"
                  required
                  placeholder="Ex: Bio do Instagram, Google Meu Negócio, Cartão de Visita"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Tipo de Origem
                </label>
                <select
                  name="tipo"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="instagram">Instagram</option>
                  <option value="google_ads">Google Ads</option>
                  <option value="google_meu_negocio">Google Meu Negócio</option>
                  <option value="site">Site</option>
                  <option value="qr">QR Code Físico (Panfleto / Placa / Cartão)</option>
                  <option value="outro">Outro canal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Mensagem Padrão
                </label>
                <textarea
                  name="mensagemPadrao"
                  rows={3}
                  defaultValue="Olá! Vi seu anúncio e gostaria de uma simulação de energia solar"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  O código rastreável de 6 dígitos será anexado automaticamente
                  ao final da mensagem.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  Gerar Canal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Visualizar e Baixar QR Code */}
      {qrModalCanal && qrDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-900/10 animate-fade-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-display text-sm font-bold text-slate-900">
                QR Code: {qrModalCanal.nome}
              </span>
              <button
                onClick={() => setQrModalCanal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="my-4 flex justify-center rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`QR Code ${qrModalCanal.nome}`}
                className="size-56 rounded-lg object-contain shadow-sm"
              />
            </div>

            <p className="text-xs text-slate-500">
              Aponte a câmera do celular para abrir a conversa no WhatsApp com a
              referência{" "}
              <strong className="text-slate-800">
                ref: {qrModalCanal.codigo}
              </strong>
            </p>

            <div className="mt-5 flex gap-2">
              <a
                href={qrDataUrl}
                download={`qrcode-${qrModalCanal.codigo}.png`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 shadow-sm"
              >
                <Download className="size-3.5" />
                Baixar PNG
              </a>
              <button
                onClick={() => setQrModalCanal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
