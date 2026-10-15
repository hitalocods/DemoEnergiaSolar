import type { Metadata } from "next";
import { KanbanBoard } from "@/components/vendas/KanbanBoard";
import { requireSessionUser } from "@/lib/auth";
import { getLeads } from "@/lib/data";

export const metadata: Metadata = {
  title: "Vendas",
  description: "Kanban de oportunidades por etapa do funil.",
};

export default async function VendasPage() {
  await requireSessionUser();
  const leadsList = await getLeads();

  return <KanbanBoard initialLeads={leadsList} />;
}
