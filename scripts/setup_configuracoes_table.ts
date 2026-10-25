import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Criando tabela configuracoes_sistema no Neon...");

  await sql`
    CREATE TABLE IF NOT EXISTS configuracoes_sistema (
      id TEXT PRIMARY KEY DEFAULT 'config_padrao',
      empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
      nome_empresa TEXT NOT NULL DEFAULT 'EBS Energia Solar',
      nome_consultor TEXT NOT NULL DEFAULT 'Samuel',
      msg_boas_vindas TEXT NOT NULL DEFAULT 'Olá! Seja muito bem-vindo à EBS Energia Solar ☀️.\n\nPara iniciarmos sua simulação rápida e personalizada, por onde você conheceu nossa empresa?',
      msg_conclusao TEXT NOT NULL DEFAULT 'Excelente! Suas informações foram registradas com sucesso ✅\n\nNossa equipe de consultores da EBS Energia Solar já recebeu sua simulação e vai continuar seu atendimento aqui em instantes com a sua proposta personalizada!',
      percentual_economia NUMERIC(5, 2) NOT NULL DEFAULT 92.00,
      multiplicador_proposta NUMERIC(5, 2) NOT NULL DEFAULT 25.00,
      valor_minimo_lead_quente NUMERIC(10, 2) NOT NULL DEFAULT 300.00,
      ia_ativa_24h BOOLEAN NOT NULL DEFAULT true,
      pedir_foto_conta BOOLEAN NOT NULL DEFAULT true,
      notificar_lead_quente BOOLEAN NOT NULL DEFAULT true,
      pausar_ia_quando_humano BOOLEAN NOT NULL DEFAULT true,
      telefone_notificacao TEXT DEFAULT '558688269144',
      atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `;

  // Inserir registro inicial se não existir
  await sql`
    INSERT INTO configuracoes_sistema (
      id, empresa_id, nome_empresa, nome_consultor,
      percentual_economia, multiplicador_proposta, valor_minimo_lead_quente,
      ia_ativa_24h, pedir_foto_conta, notificar_lead_quente, pausar_ia_quando_humano
    )
    VALUES (
      'config_padrao', 'empresa_solarmais_1', 'EBS Energia Solar', 'Samuel',
      92.00, 25.00, 300.00,
      true, true, true, true
    )
    ON CONFLICT (id) DO NOTHING;
  `;

  const rows = await sql`SELECT * FROM configuracoes_sistema LIMIT 1;`;
  console.log("Tabela configuracoes_sistema pronta!", rows);
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro ao criar tabela:", err);
  process.exit(1);
});
