import type { Metadata } from "next";
import { RastreioOrigemSection } from "@/components/configuracoes/RastreioOrigemSection";
import { PainelAutomacoesConfig } from "@/components/configuracoes/PainelAutomacoesConfig";
import { SecaoLicencaAtlas } from "@/components/configuracoes/SecaoLicencaAtlas";
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
    "558681253371";

  return (
    <div className="space-y-8">
      {/* 1. LICENÇA ATLAS SOFTWARE & LOCAÇÃO DO SISTEMA */}
      <SecaoLicencaAtlas />

      {/* 2. RASTREIO DE ORIGEM (LINKS E QR CODES) */}
      <RastreioOrigemSection whatsappNumero={whatsappNumero} />

      {/* 3. PERSONALIZAÇÃO DO PAINEL E REGRAS DA IA 100% FUNCIONAIS */}
      <PainelAutomacoesConfig configInicial={config} />
    </div>
  );
}

