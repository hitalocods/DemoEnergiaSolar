import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../db";
import { leads, mensagens, oportunidades, eventosWebhook } from "../db/schema";

async function limparTudo() {
  console.log("Limpando banco de dados para recomeçar do zero...");

  await db.delete(mensagens);
  console.log("✓ Mensagens limpas.");

  await db.delete(oportunidades);
  console.log("✓ Oportunidades limpas.");

  await db.delete(leads);
  console.log("✓ Leads limpos.");

  await db.delete(eventosWebhook);
  console.log("✓ Eventos de webhook limpos.");

  console.log("BANCO ZERADO COM SUCESSO!");
  process.exit(0);
}

limparTudo().catch((err) => {
  console.error("Erro ao limpar:", err);
  process.exit(1);
});
