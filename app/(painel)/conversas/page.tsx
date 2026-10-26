import type { Metadata } from "next";
import { ConversasView } from "@/components/conversas/ConversasView";
import { requireSessionUser } from "@/lib/auth";
import { getLeads } from "@/lib/data";

export const metadata: Metadata = {
  title: "Conversas WhatsApp",
  description: "Atendimento em tempo real e histórico de conversas no WhatsApp oficial da EBS Energia Solar.",
};

export default async function ConversasPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string }>;
}) {
  await requireSessionUser();
  const { leadId } = await searchParams;
  const leadsList = await getLeads();

  return <ConversasView initialLeads={leadsList} initialLeadId={leadId} />;
}
