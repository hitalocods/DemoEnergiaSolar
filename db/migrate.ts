import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function runMigrate() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL não encontrada no .env.local");
  }

  console.log("Conectando ao Neon Postgres...");
  const sql = neon(dbUrl);
  const db = drizzle(sql);

  console.log("Aplicando migrações em ./drizzle...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ Migrações aplicadas com sucesso!");
}

runMigrate().catch((err) => {
  console.error("Erro ao rodar migrações:", err);
  process.exit(1);
});
