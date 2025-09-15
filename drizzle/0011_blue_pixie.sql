CREATE TABLE "interview_chats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"chat_history" text,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"extracted_academic_background" text,
	"extracted_research_interest" text,
	"extracted_recent_reading" text,
	"extracted_learning_goal" text,
	"extracted_discussion_style" text,
	"total_messages" integer DEFAULT 0,
	"session_duration" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "interview_chats" ADD CONSTRAINT "interview_chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;