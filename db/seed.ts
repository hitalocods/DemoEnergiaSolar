import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import {
  empresas,
  usuarios,
  leads,
  oportunidades,
  mensagens,
} from "./schema";
import { MOCK_LEADS, MOCK_MESSAGES } from "../lib/mock";

async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

async function runSeed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL não encontrada no .env.local");
  }

  console.log("Conectando ao banco para popular dados...");
  const sql = neon(dbUrl);
  const db = drizzle(sql);

  // 1. Limpa registros prévios para seed idempotente
  console.log("Limpando dados anteriores...");
  await db.delete(mensagens);
  await db.delete(oportunidades);
  await db.delete(leads);
  await db.delete(usuarios);
  await db.delete(empresas);

  // 2. Cria empresa padrão
  const EMPRESA_ID = "empresa_solarmais_1";
  console.log("Criando empresa SolarMais...");
  await db.insert(empresas).values({
    id: EMPRESA_ID,
    nome: "SolarMais",
    criadoEm: new Date(),
  });

  // 3. Cria usuário consultor padrão a partir de variáveis de ambiente obrigatórias
  const seedEmail = process.env.SEED_EMAIL?.trim();
  const seedPassword = process.env.SEED_PASSWORD?.trim();

  if (!seedEmail || !seedPassword) {
    throw new Error(
      "ABORTANDO SEED: As variáveis de ambiente SEED_EMAIL e SEED_PASSWORD são obrigatórias para criar o usuário inicial. Defina-as no arquivo .env.local ou no ambiente antes de executar o seed."
    );
  }

  const USUARIO_ID = "user_rafael_1";
  const senhaHash = await hashPassword(seedPassword);
  console.log(`Criando usuário consultor (${seedEmail})...`);
  await db.insert(usuarios).values({
    id: USUARIO_ID,
    empresaId: EMPRESA_ID,
    nome: "Rafael Nunes",
    email: seedEmail,
    senhaHash,
    cargo: "Consultor comercial",
    criadoEm: new Date(),
  });

  // 4. Insere os 12 leads
  console.log("Inserindo os 12 leads mockados no banco...");
  for (const mock of MOCK_LEADS) {
    const isHuman = mock.attendance === "humano";
    const propertyTypeMapped = mock.propertyType.toLowerCase() as
      | "residencial"
      | "comercial"
      | "rural";

    await db.insert(leads).values({
      id: mock.id,
      empresaId: EMPRESA_ID,
      nome: mock.name,
      telefone: mock.phone,
      cidade: `${mock.city} - ${mock.state}`,
      contaMedia: mock.billValue.toFixed(2),
      tipo: propertyTypeMapped,
      imovelProprio: mock.ownProperty,
      financiamento: mock.wantsFinancing,
      contaEnviada: mock.status !== "aguardando_conta",
      temperatura: mock.status,
      atendimento: mock.attendance,
      assumidoPor: isHuman ? USUARIO_ID : null,
      origem: mock.adSource,
      campanha: mock.adSource,
      economiaEstimada: (mock.billValue * 0.9).toFixed(2),
      criadoEm: new Date(mock.createdAt),
      atualizadoEm: new Date(),
    });

    // Se tiver etapa no funil, cria oportunidade
    if (mock.stage) {
      await db.insert(oportunidades).values({
        id: `op_${mock.id}`,
        empresaId: EMPRESA_ID,
        leadId: mock.id,
        etapa: mock.stage,
        valorProposta: (mock.proposalValue ?? mock.billValue * 25).toFixed(2),
        atualizadoEm: new Date(),
      });
    }
  }

  // 5. Insere mensagens completas
  console.log(`Inserindo ${MOCK_MESSAGES.length} mensagens no banco...`);
  for (const msg of MOCK_MESSAGES) {
    await db.insert(mensagens).values({
      id: msg.id,
      empresaId: EMPRESA_ID,
      leadId: msg.leadId,
      autor: msg.from,
      usuarioId: msg.from === "humano" ? USUARIO_ID : null,
      texto: msg.text,
      anexoUrl: msg.attachment ? `/attachments/${msg.attachment.label}` : null,
      anexoTipo: msg.attachment?.type ?? null,
      waMessageId: `wamid_${msg.id}`,
      criadoEm: new Date(msg.createdAt),
    });
  }

  console.log("✓ Seed finalizado com sucesso!");
}

runSeed().catch((err) => {
  console.error("Erro ao rodar seed:", err);
  process.exit(1);
});
