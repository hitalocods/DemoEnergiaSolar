CREATE TABLE "eventos_webhook" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"erro" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "ultima_msg_lead_em" timestamp with time zone;