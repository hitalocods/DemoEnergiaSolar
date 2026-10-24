import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../db";
import { eventosWebhook } from "../db/schema";
import { desc } from "drizzle-orm";

async function main() {
  const evts = await db.select().from(eventosWebhook).orderBy(desc(eventosWebhook.criadoEm)).limit(5);
  for (const e of evts) {
    console.log("\n================ EVENTO ================");
    console.log(JSON.stringify(e.payload, null, 2));
  }
}

main().catch(console.error);
