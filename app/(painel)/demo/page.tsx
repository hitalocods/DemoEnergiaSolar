import type { Metadata } from "next";
import { DemoContainer } from "@/components/demo/DemoContainer";
import { PageHeader } from "@/components/ui/Primitives";
import { requireSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Simulador · Demonstração Interativa",
  description:
    "Simulador da conversa de WhatsApp com a IA e visualização ao vivo do card do consultor.",
};

export default async function DemoPage() {
  await requireSessionUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulador de Atendimento IA"
        description="Experimente a conversa no WhatsApp pela perspectiva do cliente e acompanhe a qualificação em tempo real pelo CRM."
      />

      <DemoContainer />
    </div>
  );
}
