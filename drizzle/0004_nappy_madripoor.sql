CREATE TYPE "public"."origem_tipo" AS ENUM('meta_ads', 'google_ads', 'google_meu_negocio', 'instagram', 'site', 'qr', 'outro', 'direto');--> statement-breakpoint
CREATE TYPE "public"."tipo_canal_rastreio" AS ENUM('google_ads', 'google_meu_negocio', 'instagram', 'site', 'qr', 'outro');--> statement-breakpoint
CREATE TABLE "canais_rastreio" (
	"id" text PRIMARY KEY NOT NULL,
	"empresa_id" text NOT NULL,
	"nome" text NOT NULL,
	"tipo" "tipo_canal_rastreio" DEFAULT 'outro' NOT NULL,
	"codigo" text NOT NULL,
	"mensagem_padrao" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "canais_rastreio_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "cliques_origem" (
	"id" text PRIMARY KEY NOT NULL,
	"empresa_id" text NOT NULL,
	"codigo" text NOT NULL,
	"canal_id" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_term" text,
	"gclid" text,
	"pagina_origem" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"usado_em" timestamp with time zone,
	CONSTRAINT "cliques_origem_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "origem_tipo" "origem_tipo" DEFAULT 'direto' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "campanha_utm" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "gclid" text;--> statement-breakpoint
ALTER TABLE "canais_rastreio" ADD CONSTRAINT "canais_rastreio_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cliques_origem" ADD CONSTRAINT "cliques_origem_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cliques_origem" ADD CONSTRAINT "cliques_origem_canal_id_canais_rastreio_id_fk" FOREIGN KEY ("canal_id") REFERENCES "public"."canais_rastreio"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "canais_rastreio_codigo_idx" ON "canais_rastreio" USING btree ("codigo");--> statement-breakpoint
CREATE INDEX "canais_rastreio_empresa_idx" ON "canais_rastreio" USING btree ("empresa_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cliques_origem_codigo_idx" ON "cliques_origem" USING btree ("codigo");--> statement-breakpoint
CREATE INDEX "cliques_origem_empresa_idx" ON "cliques_origem" USING btree ("empresa_id");