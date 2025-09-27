CREATE TYPE "public"."mailbox_sync_phase" AS ENUM('BOOTSTRAP', 'BACKFILL', 'IDLE');--> statement-breakpoint
CREATE TABLE "mailbox_sync" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_id" uuid NOT NULL,
	"mailbox_id" uuid NOT NULL,
	"uid_validity" bigint NOT NULL,
	"last_seen_uid" bigint DEFAULT 0 NOT NULL,
	"backfill_cursor_uid" bigint DEFAULT 0 NOT NULL,
	"highest_modseq" numeric(20, 0),
	"phase" "mailbox_sync_phase" DEFAULT 'BOOTSTRAP' NOT NULL,
	"synced_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "mailbox_sync" ADD CONSTRAINT "mailbox_sync_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."identities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailbox_sync" ADD CONSTRAINT "mailbox_sync_mailbox_id_mailboxes_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_mailbox_sync_mailbox" ON "mailbox_sync" USING btree ("mailbox_id");--> statement-breakpoint
CREATE INDEX "ix_mailbox_sync_identity" ON "mailbox_sync" USING btree ("identity_id");--> statement-breakpoint
CREATE INDEX "ix_mailbox_sync_phase" ON "mailbox_sync" USING btree ("phase");