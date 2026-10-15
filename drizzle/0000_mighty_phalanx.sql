CREATE TYPE "public"."atendimento_modo" AS ENUM('ia', 'humano');--> statement-breakpoint
CREATE TYPE "public"."autor_mensagem" AS ENUM('ia', 'lead', 'humano');--> statement-breakpoint
CREATE TYPE "public"."etapa_oportunidade" AS ENUM('proposta', 'negociacao', 'venda', 'perdido');--> statement-breakpoint
CREATE TYPE "public"."temperatura_lead" AS ENUM('quente', 'morno', 'aguardando_conta');--> statement-breakpoint
CREATE TYPE "public"."tipo_imovel" AS ENUM('residencial', 'comercial', 'rural');--> statement-breakpoint
CREATE TABLE "empresas" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"empresa_id" text NOT NULL,
	"nome" text NOT NULL,
	"telefone" text NOT NULL,
	"cidade" text NOT NULL,
	"conta_media" numeric(12, 2) NOT NULL,
	"tipo" "tipo_imovel" DEFAULT 'residencial' NOT NULL,
	"imovel_proprio" boolean,
	"financiamento" boolean,
	"conta_enviada" boolean DEFAULT false NOT NULL,
	"temperatura" "temperatura_lead" DEFAULT 'morno' NOT NULL,
	"atendimento" "atendimento_modo" DEFAULT 'ia' NOT NULL,
	"assumido_por" text,
	"origem" text DEFAULT 'Direto' NOT NULL,
	"anuncio_id" text,
	"campanha" text,
	"economia_estimada" numeric(12, 2),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mensagens" (
	"id" text PRIMARY KEY NOT NULL,
	"empresa_id" text NOT NULL,
	"lead_id" text NOT NULL,
	"autor" "autor_mensagem" NOT NULL,
	"usuario_id" text,
	"texto" text NOT NULL,
	"anexo_url" text,
	"anexo_tipo" text,
	"wa_message_id" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mensagens_wa_message_id_unique" UNIQUE("wa_message_id")
);
--> statement-breakpoint
CREATE TABLE "oportunidades" (
	"id" text PRIMARY KEY NOT NULL,
	"empresa_id" text NOT NULL,
	"lead_id" text NOT NULL,
	"etapa" "etapa_oportunidade" DEFAULT 'proposta' NOT NULL,
	"valor_proposta" numeric(12, 2) NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" text PRIMARY KEY NOT NULL,
	"empresa_id" text NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"cargo" text DEFAULT 'Consultor comercial' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assumido_por_usuarios_id_fk" FOREIGN KEY ("assumido_por") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "leads_empresa_telefone_unique" ON "leads" USING btree ("empresa_id","telefone");--> statement-breakpoint
CREATE INDEX "leads_empresa_temperatura_idx" ON "leads" USING btree ("empresa_id","temperatura");--> statement-breakpoint
CREATE INDEX "mensagens_lead_criado_idx" ON "mensagens" USING btree ("lead_id","criado_em");--> statement-breakpoint
CREATE UNIQUE INDEX "oportunidades_lead_id_unique" ON "oportunidades" USING btree ("lead_id");