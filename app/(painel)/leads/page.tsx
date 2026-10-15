import type { Metadata } from "next";
import { LeadsView } from "@/components/leads/LeadsView";
import { requireSessionUser } from "@/lib/auth";
import { getLeads } from "@/lib/data";

export const metadata: Metadata = {
  title: "Leads Qualificados",
  description: "Leads qualificados pela IA, prontos para atendimento humano.",
};

export default async function LeadsPage() {
  await requireSessionUser();
  const leadsList = await getLeads();

  return <LeadsView initialLeads={leadsList} />;
}
