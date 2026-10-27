import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`
    UPDATE configuracoes_sistema
    SET msg_boas_vindas = 'Olá! Seja muito bem-vindo à EBS Energia Solar ☀️.\n\n[1/6] 📍 Para iniciarmos sua simulação rápida e personalizada, por onde você conheceu nossa empresa?'
    WHERE id = 'config_padrao';
  `;

  const rows = await sql`SELECT msg_boas_vindas FROM configuracoes_sistema WHERE id = 'config_padrao';`;
  console.log("Mensagem de boas-vindas no Neon:", rows[0]?.msg_boas_vindas);
  process.exit(0);
}

main().catch(console.error);
