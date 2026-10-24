import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  console.log("Token:", token?.slice(0, 15) + "...");
  console.log("PhoneId:", phoneId);

  for (const to of ["5586988269144", "558688269144"]) {
    console.log(`\n--- Testando envio direto para: ${to} ---`);
    const res = await fetch(`https://graph.facebook.com/v23.0/${phoneId}/messages`, {
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
          body: "Olá! Teste de entrega direta SolarMais.",
        },
      }),
    });

    const data = await res.json();
    console.log(`Status HTTP: ${res.status}`);
    console.log("Resposta Meta:", JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);
