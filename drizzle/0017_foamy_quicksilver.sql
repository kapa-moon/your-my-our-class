ALTER TABLE "persona_comments" ADD COLUMN "manual_reply" text;--> statement-breakpoint
ALTER TABLE "persona_comments" ADD COLUMN "is_reply_from_owner" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "persona_comments" ADD COLUMN "reply_edited_at" timestamp;