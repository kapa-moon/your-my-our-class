CREATE TABLE "playground_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"conversation_type" text NOT NULL,
	"user_goal" text,
	"participating_agents" text NOT NULL,
	"memory_pad" text,
	"moderation_rule" text,
	"speaker_queue" text,
	"is_ended" boolean DEFAULT false,
	"ended_at" timestamp,
	"total_utterances" integer DEFAULT 0,
	"last_activity_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "playground_utterances" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"speaker_id" integer,
	"speaker_type" text NOT NULL,
	"speaker_name" text,
	"content" text NOT NULL,
	"generation_context" text,
	"timestamp" timestamp DEFAULT now(),
	"sequence_number" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "playground_conversations" ADD CONSTRAINT "playground_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playground_utterances" ADD CONSTRAINT "playground_utterances_conversation_id_playground_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."playground_conversations"("id") ON DELETE no action ON UPDATE no action;