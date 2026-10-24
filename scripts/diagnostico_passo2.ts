import { config } from "dotenv";
config({ path: ".env.local" });

async function runDirectTest() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const numbers = ["5586988269144", "558688269144"];

  for (const to of numbers) {
    console.log(`\n======================================================`);
    console.log(`TESTE DIRETO POST /messages -> Destinatário: "${to}"`);
    console.log(`======================================================`);

    const url = `https://graph.facebook.com/v23.0/${phoneId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: {
        preview_url: false,
        body: "Diagnóstico SolarMais: Teste de entrega direta.",
      },
    };

    console.log("PAYLOAD ENVIADO (Request Body):", JSON.stringify(payload, null, 2));

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log(`STATUS HTTP: ${res.status}`);
    console.log("RESPOSTA CRUA DA META (Response Body):", JSON.stringify(data, null, 2));
  }
}

runDirectTest().catch(console.error);
