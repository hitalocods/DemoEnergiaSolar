import { config } from "dotenv";
config({ path: ".env.local" });

async function test(to: string) {
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
      to: to,
      type: "template",
      template: {
        name: "hello_world",
        language: { code: "en_US" },
      },
    }),
  });

  const data = await res.json();
  console.log(`Resultado para ${to}:`, JSON.stringify(data, null, 2));
}

async function run() {
  console.log("Testando com 9 dígitos: 5586988269144");
  await test("5586988269144");

  console.log("\nTestando sem o nono dígito: 558688269144");
  await test("558688269144");
}

run();
