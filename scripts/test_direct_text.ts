import { config } from "dotenv";
config({ path: ".env.local" });

async function sendDirectText(to: string, msg: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const url = `https://graph.facebook.com/v23.0/${phoneId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: {
        preview_url: false,
        body: msg,
      },
    }),
  });

  const data = await res.json();
  console.log(`Envio texto direto para ${to}:`, JSON.stringify(data, null, 2));
}

async function run() {
  console.log("Enviando texto normal para 5586988269144...");
  await sendDirectText("5586988269144", "Teste SolarMais: Conexão ativa com sucesso! ☀️🔋");

  console.log("\nEnviando texto normal para 558688269144...");
  await sendDirectText("558688269144", "Teste SolarMais: Conexão ativa com sucesso! ☀️🔋");
}

run();
