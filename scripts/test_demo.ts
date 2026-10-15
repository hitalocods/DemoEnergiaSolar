import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../db";
import { empresas, leads, mensagens } from "../db/schema";
import { eq } from "drizzle-orm";
import { processarMensagemInbound } from "../lib/ia/processador";
import { criarLeadDemo, limparLeadsDemo } from "../lib/demo";
import { sendText } from "../lib/whatsapp";

async function testDemo() {
  console.log("--- 1. TESTE DE SEGURANÇA EM sendText COM demo- ---");
  const fakeId = await sendText("demo-123456", "Teste de segurança");
  console.log("sendText retornou ID:", fakeId);
  if (!fakeId.startsWith("demo-")) throw new Error("Falha de segurança em sendText");

  console.log("\n--- 2. TESTE DE CRIAÇÃO DE LEAD DEMO ---");
  const empresaRows = await db.select({ id: empresas.id }).from(empresas).limit(1);
  const empresaId = empresaRows[0].id;
  const novoLead = await criarLeadDemo(empresaId);
  console.log("Lead criado:", novoLead);

  console.log("\n--- 3. TESTE DE MENSAGEM VIA processarMensagemInbound ---");
  const res1 = await processarMensagemInbound({
    empresaId,
    telefone: novoLead.telefone,
    nome: "Visitante Demo",
    texto: "Oi, vi o anúncio",
    isDemo: true,
  });
  console.log("Resultado processarMensagemInbound:", res1);

  const msgs = await db
    .select({ autor: mensagens.autor, texto: mensagens.texto })
    .from(mensagens)
    .where(eq(mensagens.leadId, novoLead.id));
  console.log("Mensagens gravadas no banco:", msgs);

  const leadRow = (await db.select().from(leads).where(eq(leads.id, novoLead.id)))[0];
  console.log("Lead no banco:", {
    nome: leadRow.nome,
    telefone: leadRow.telefone,
    demo: leadRow.demo,
    temperatura: leadRow.temperatura,
  });
  if (leadRow.demo !== true) throw new Error("Lead demo deve ter demo = true");

  console.log("\n--- 4. TESTE DE LIMPEZA DE LEADS DEMO ---");
  const totalLimpos = await limparLeadsDemo(empresaId);
  console.log("Total de leads demo limpos:", totalLimpos);

  const remaining = await db.select().from(leads).where(eq(leads.id, novoLead.id));
  console.log("Leads restantes com este id:", remaining.length);
  if (remaining.length !== 0) throw new Error("Lead demo deveria ter sido removido");

  console.log("\n✅ TODOS OS TESTES DA FASE 3D PASSARAM COM SUCESSO!");
}

testDemo().catch(console.error);
