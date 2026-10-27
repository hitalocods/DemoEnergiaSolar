import type { Metadata } from "next";
import { RastreioOrigemSection } from "@/components/configuracoes/RastreioOrigemSection";
import { PainelAutomacoesConfig } from "@/components/configuracoes/PainelAutomacoesConfig";
import { getSystemConfig } from "@/lib/config-helper";

export const metadata: Metadata = {
  title: "Configurações",
  description: "Configure a IA, integrações de WhatsApp, equipe e notificações.",
};

export default async function ConfiguracoesPage() {
  const config = await getSystemConfig();
  const whatsappNumero =
    process.env.WHATSAPP_NUMERO_PUBLICO ||
    config.telefoneNotificacao ||
    "558688269144";

  return (
    <div className="space-y-8">
      {/* 1. RASTREIO DE ORIGEM (LINKS E QR CODES) */}
      <RastreioOrigemSection whatsappNumero={whatsappNumero} />

      {/* 2. PERSONALIZAÇÃO DO PAINEL E REGRAS DA IA 100% FUNCIONAIS */}
      <PainelAutomacoesConfig configInicial={config} />
    </div>
  );
}

