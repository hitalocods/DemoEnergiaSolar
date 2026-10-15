import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { requireSessionUser } from "@/lib/auth";
import { getLeads, getMetrics } from "@/lib/data";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Métricas de atendimento e funil de vendas da SolarMais.",
};

export default async function DashboardPage() {
  const user = await requireSessionUser();
  const [initialMetrics, initialLeads] = await Promise.all([
    getMetrics("30d"),
    getLeads(),
  ]);

  return (
    <DashboardView
      initialMetrics={initialMetrics}
      initialLeads={initialLeads}
      userName={user.nome}
    />
  );
}
