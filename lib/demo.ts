import crypto from "crypto";
import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, mensagens, oportunidades } from "@/db/schema";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Salva imagem enviada na tela de demo.
 * Em desenvolvimento: salva em /public/uploads
 * Em produção: salva no Vercel Blob
 */
export async function salvarImagemDemo(file: File): Promise<string> {
  // 1. Validação estrita de tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Tipo de arquivo '${file.type}' não permitido. Apenas imagens JPEG, PNG e WebP são aceitas.`
    );
  }

  // 2. Validação estrita de tamanho (máximo 5 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `O arquivo enviado (${(file.size / (1024 * 1024)).toFixed(1)} MB) excede o limite máximo permitido de 5 MB.`
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || (file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg");
  const filename = `${crypto.randomUUID()}${ext}`;

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const dest = path.join(uploadsDir, filename);
    fs.writeFileSync(dest, buffer);
    return `/uploads/${filename}`;
  } else {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new Error(
        "BLOB_READ_WRITE_TOKEN não configurado no ambiente de produção para upload de arquivos."
      );
    }

    const blob = await put(`demo/${filename}`, buffer, {
      access: "public",
      contentType: file.type,
      token,
    });
    return blob.url;
  }
}

/**
 * Cria um lead novo específico de demonstração.
 */
export async function criarLeadDemo(empresaId: string) {
  const idAleatorio = crypto.randomUUID().slice(0, 8);
  const telefone = `demo-${idAleatorio}`;
  const leadId = `lead_${crypto.randomUUID()}`;

  await db.insert(leads).values({
    id: leadId,
    empresaId,
    nome: "Visitante Demo",
    telefone,
    cidade: "Não informada",
    contaMedia: "0.00",
    tipo: "residencial",
    temperatura: "aguardando_conta",
    atendimento: "ia",
    origem: "Demo",
    demo: true,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  });

  return { id: leadId, telefone };
}

/**
 * Apaga todos os leads de demo e suas respectivas mensagens e oportunidades.
 */
export async function limparLeadsDemo(empresaId: string) {
  const demoLeads = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.empresaId, empresaId), eq(leads.demo, true)));

  for (const l of demoLeads) {
    await db.delete(mensagens).where(eq(mensagens.leadId, l.id));
    await db.delete(oportunidades).where(eq(oportunidades.leadId, l.id));
    await db.delete(leads).where(eq(leads.id, l.id));
  }

  return demoLeads.length;
}
