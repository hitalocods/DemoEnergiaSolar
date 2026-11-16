"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, Apple, Check, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function BotaoInstalarApp({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [instalado, setInstalado] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setInstalado(true);
      setDeferredPrompt(null);
      setModalOpen(false);
    });

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const isIOS =
    typeof window !== "undefined" &&
    /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari navigator.standalone
      window.navigator.standalone === true);

  if (dismissed || isStandalone || instalado) {
    return null;
  }

  async function handleInstalarClick() {
    // Se for Android/Chrome com prompt nativo pronto
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setInstalado(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Erro ao instalar PWA:", err);
        setModalOpen(true);
      }
    } else {
      // Se for iOS (Safari) ou navegador sem prompt automático, abre instruções claras
      setModalOpen(true);
    }
  }

  return (
    <>
      <button
        onClick={handleInstalarClick}
        title="Instalar App no celular (iOS / Android)"
        className={
          className ||
          "group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
        }
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
        </span>
        <Smartphone className="size-4 text-blue-200" />
        <span>Instalar App</span>
      </button>

      {/* MODAL DE INSTRUÇÕES (PARA IPHONE E ANDROID) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                {isIOS ? <Apple className="size-6" /> : <Smartphone className="size-6" />}
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Instalar EBS Solar</h3>
                <p className="text-xs text-slate-400">Direto na sua tela inicial</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-xs text-slate-300">
              {isIOS ? (
                <>
                  <p className="text-slate-300">
                    No Safari do iPhone/iPad, siga estes 2 passos:
                  </p>
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-800/60 p-3 border border-slate-700/60">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white font-bold text-xs">
                      1
                    </span>
                    <p>
                      Toque no botão <span className="font-bold text-white inline-flex items-center gap-1"><Share className="size-3.5 text-blue-400 inline" /> Compartilhar</span> na barra do Safari.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-800/60 p-3 border border-slate-700/60">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white font-bold text-xs">
                      2
                    </span>
                    <p>
                      Role para baixo e selecione <span className="font-bold text-white">&quot;Adicionar à Tela de Início&quot;</span>.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-slate-300">
                    No Chrome do Android ou computador:
                  </p>
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-800/60 p-3 border border-slate-700/60">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white font-bold text-xs">
                      1
                    </span>
                    <p>
                      Toque nos <strong>três pontinhos (⋮)</strong> no canto superior do navegador.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-800/60 p-3 border border-slate-700/60">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white font-bold text-xs">
                      2
                    </span>
                    <p>
                      Toque em <span className="font-bold text-white">&quot;Instalar aplicativo&quot;</span> ou <span className="font-bold text-white">&quot;Adicionar à tela inicial&quot;</span>.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-xs font-bold text-white transition"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
