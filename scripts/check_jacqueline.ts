import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../db";
import { leads, mensagens } from "../db/schema";
import { ilike, eq, asc } from "drizzle-orm";

async function check() {
  const l = await db.select().from(leads).where(ilike(leads.nome, "%Jacqueline%"));
  console.log("Lead Jacqueline:", JSON.stringify(l, null, 2));
  if (l.length > 0) {
    const { oportunidades } = await import("../db/schema");
    const lead = l[0];
    const val = Number(lead.contaMedia || "1500") * 25;
    await db.insert(oportunidades).values({
      id: `op_${lead.id}`,
      empresaId: lead.empresaId,
      leadId: lead.id,
      etapa: "proposta",
      valorProposta: val.toFixed(2),
      atualizadoEm: new Date(),
    });
    console.log("✓ Oportunidade de R$", val, "criada com sucesso para", lead.nome);
  }
  process.exit(0);
}
check();
