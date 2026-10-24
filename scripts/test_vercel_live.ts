async function test() {
  const url = "https://demo-ecru-five-92.vercel.app/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=solarmais_webhook_verify_token_2026&hub.challenge=teste_desafio_123";
  try {
    const res = await fetch(url);
    const body = await res.text();
    console.log("Status retornado pela Vercel:", res.status);
    console.log("Corpo retornado pela Vercel:", body);
  } catch (e: any) {
    console.error("Erro ao conectar na Vercel:", e.message);
  }
}
test();
