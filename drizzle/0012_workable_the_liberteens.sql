CREATE TABLE "presentable_personas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"affiliation" text,
	"background" text,
	"discussion_style" text,
	"guiding_question" text,
	"learning_goals" text,
	"recent_interests" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "presentable_personas" ADD CONSTRAINT "presentable_personas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;