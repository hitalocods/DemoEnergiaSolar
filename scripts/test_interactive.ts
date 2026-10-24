import { config } from "dotenv";
config({ path: ".env.local" });
import { sendInteractiveList, sendInteractiveButtons } from "../lib/whatsapp";

async function main() {
  console.log("Testando envio de botões rápidos para 5586988269144...");
  const btnId = await sendInteractiveButtons(
    "5586988269144",
    "Qual o tipo do seu imóvel?",
    [
      { id: "imovel_residencial", title: "Residencial" },
      { id: "imovel_comercial", title: "Comercial" },
      { id: "imovel_rural", title: "Rural" },
    ],
    "SolarMais"
  );
  console.log("Sucesso no envio de botões! ID:", btnId);
}

main().catch((err) => {
  console.error("Erro no teste de botões:", err.message);
});
