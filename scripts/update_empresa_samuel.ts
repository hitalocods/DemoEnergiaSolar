import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../db";
import { empresas, usuarios } from "../db/schema";
import { eq } from "drizzle-orm";

async function run() {
  await db
    .update(empresas)
    .set({ nome: "EBS Energia Solar" })
    .where(eq(empresas.id, "empresa_solarmais_1"));

  await db
    .update(usuarios)
    .set({ nome: "Samuel", email: "samuel@ebsenergiasolar.com.br" })
    .where(eq(usuarios.id, "user_rafael_1"));

  console.log("✓ Empresa e Usuário atualizados no Neon Postgres!");
  const emp = await db.select().from(empresas);
  const usr = await db.select({ id: usuarios.id, nome: usuarios.nome, email: usuarios.email }).from(usuarios);
  console.log("Empresas:", emp);
  console.log("Usuários:", usr);
  process.exit(0);
}
run();
