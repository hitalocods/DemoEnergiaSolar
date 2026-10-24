import type { Metadata } from "next";
import { Bell, Bot, MessageCircle, Settings, ShieldCheck, Users, Workflow } from "lucide-react";
import { ComingSoon } from "@/components/placeholder/ComingSoon";
import { RastreioOrigemSection } from "@/components/configuracoes/RastreioOrigemSection";

export const metadata: Metadata = {
  title: "Configurações",
  description: "Configure a IA, integrações de WhatsApp, equipe e notificações.",
};

const PREVIEW_ITEMS = [
  { label: "IA responde fora do horário comercial", on: true },
  { label: "Pedir foto da conta automaticamente", on: true },
  { label: "Avisar consultor quando lead ficar quente", on: true },
  { label: "Distribuir leads em rodízio", on: false },
];

export default function ConfiguracoesPage() {
  const whatsappNumero = process.env.WHATSAPP_NUMERO_PUBLICO || "5586994127788";

  return (
    <div className="space-y-8">
      <RastreioOrigemSection whatsappNumero={whatsappNumero} />

      <ComingSoon
        icon={Settings}
        eyebrow="Mais Configurações"
        title="Personalize seu painel e automações"
        description="Ajuste o tom da assistente, as perguntas de qualificação, a equipe de vendas e as integrações — sem precisar de programador."
        preview={
          <div className="space-y-2.5 rounded-2xl bg-white/[0.06] p-5 ring-1 ring-inset ring-white/10 backdrop-blur">
            {PREVIEW_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.04] px-4 py-3">
                <span className="text-sm text-slate-200">{item.label}</span>
                <span className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 ${item.on ? "bg-green-500" : "bg-slate-600"}`}>
                  <span className={`size-4 rounded-full bg-white transition ${item.on ? "translate-x-4" : ""}`} />
                </span>
              </div>
            ))}
          </div>
        }
        features={[
          { icon: Bot, title: "Personalidade da IA", text: "Nome, tom de voz e perguntas de qualificação da assistente virtual." },
          { icon: MessageCircle, title: "WhatsApp Business", text: "Conecte o número oficial e gerencie modelos de mensagem aprovados." },
          { icon: Users, title: "Equipe e permissões", text: "Convide consultores, defina gestores e regras de distribuição de leads." },
          { icon: Workflow, title: "Regras de qualificação", text: "Defina o que torna um lead quente: valor da conta, cidade, financiamento." },
          { icon: Bell, title: "Notificações", text: "Alertas no celular quando um lead quente chegar ou ficar sem resposta." },
          { icon: ShieldCheck, title: "Privacidade e LGPD", text: "Termos de consentimento, retenção de conversas e exportação de dados." },
        ]}
      />
    </div>
  );
}
