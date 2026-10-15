ALTER TABLE "leads" ADD COLUMN "ia_lock_ate" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "motivo_transferencia" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "recusou_foto" boolean DEFAULT false NOT NULL;