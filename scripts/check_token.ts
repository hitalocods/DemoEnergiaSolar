import { config } from "dotenv";
config({ path: ".env.local" });

async function checkToken() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const res = await fetch(`https://graph.facebook.com/v23.0/${phoneId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Resultado Token:", JSON.stringify(data, null, 2));
}

checkToken();
