import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { db } from "../db";
import { leads, mensagens, oportunidades } from "../db/schema";

async function main() {
  const args = process.argv.slice(2);
  let isNovo = false;
  let isFoto = false;
  let imagemCaminho = "";
  let leadNum = "1";
  const textWords: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--novo") {
      isNovo = true;
    } else if (arg === "--lead") {
      leadNum = args[i + 1] || "1";
      i++;
    } else if (arg === "--foto" || arg === "--imagem") {
      isFoto = true;
      if (args[i + 1] && !args[i + 1].startsWith("--")) {
        imagemCaminho = args[i + 1];
        i++;
      }
    } else {
      textWords.push(arg);
    }
  }

  const waId = leadNum === "1" ? "5586900000001" : `558690000000${leadNum}`;
  const leadNome = leadNum === "1" ? "Teste Simulado" : `Teste Simulado ${leadNum}`;
  const texto = textWords.join(" ").trim() || (isFoto ? "[imagem]" : "Olá! Gostaria de um orçamento.");

  if (isNovo) {
    console.log(`🧹 Removendo histórico do lead ${leadNome} (${waId})...`);
    try {
      const existing = await db
        .select()
        .from(leads)
        .where(eq(leads.telefone, waId));

      for (const l of existing) {
        await db.delete(mensagens).where(eq(mensagens.leadId, l.id));
        await db.delete(oportunidades).where(eq(oportunidades.leadId, l.id));
        await db.delete(leads).where(eq(leads.id, l.id));
      }
      console.log("✓ Lead e mensagens anteriores limpos com sucesso.");
    } catch (cleanErr) {
      console.error("Erro ao limpar dados anteriores do lead:", cleanErr);
    }
  }

  const msgId = `wamid.sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const isImageMsg = isFoto || texto === "[imagem]";

  const messagePayload: Record<string, unknown> = {
    from: waId,
    id: msgId,
    timestamp: Math.floor(Date.now() / 1000).toString(),
    type: isImageMsg ? "image" : "text",
  };

  if (isImageMsg) {
    const mediaId = imagemCaminho ? `local:${imagemCaminho}` : "sim_media_conta_energia";
    messagePayload.image = {
      id: mediaId,
      caption: texto !== "[imagem]" ? texto : "conta_energia.jpg",
      mime_type: "image/jpeg",
    };
  } else {
    messagePayload.text = { body: texto };
  }

  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "123456",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "5511999999999",
                phone_number_id: "000000",
              },
              contacts: [
                {
                  profile: { name: leadNome },
                  wa_id: waId,
                },
              ],
              messages: [messagePayload],
            },
          },
        ],
      },
    ],
  };

  const webhookUrl = "http://localhost:3000/api/whatsapp/webhook";
  console.log(`📤 Enviando mensagem como "${leadNome}" (${waId}): "${texto}"`);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resJson = await res.json();
    console.log(`📥 Resposta do webhook (HTTP ${res.status}):`, resJson);
    console.log(
      `⏳ Aguardando processamento da IA... Verifique o console do Next.js (npm run dev) e o painel /leads.`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Falha ao chamar o webhook (${webhookUrl}): ${msg}`);
    console.error(
      `Certifique-se de que o servidor Next.js está rodando (npm run dev na porta 3000).`
    );
  }
}

main().catch((err) => {
  console.error("Erro no script de simulação:", err);
  process.exit(1);
});
