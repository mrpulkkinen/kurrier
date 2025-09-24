CREATE TABLE "threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid DEFAULT auth.uid() NOT NULL,
	"mailbox_id" uuid NOT NULL,
	"root_message_id" text NOT NULL,
	"subject_normalized" text,
	"participants" jsonb DEFAULT '[]'::jsonb,
	"last_message_date" timestamp with time zone,
	"last_message_id" uuid DEFAULT null,
	"message_count" integer DEFAULT 1 NOT NULL,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"last_snippet" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "threads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "message_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "in_reply_to" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "references" text[];--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "reply_to" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "delivered_to" text;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_mailbox_id_mailboxes_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_last_message_id_messages_id_fk" FOREIGN KEY ("last_message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_thread_mailbox_root" ON "threads" USING btree ("mailbox_id","root_message_id");--> statement-breakpoint
CREATE INDEX "idx_threads_mailbox_updated" ON "threads" USING btree ("mailbox_id","updated_at");--> statement-breakpoint
CREATE INDEX "idx_threads_mailbox_lastdate" ON "threads" USING btree ("mailbox_id","last_message_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_mailbox_message_id" ON "messages" USING btree ("mailbox_id","message_id");--> statement-breakpoint
CREATE INDEX "idx_messages_in_reply_to" ON "messages" USING btree ("in_reply_to");
