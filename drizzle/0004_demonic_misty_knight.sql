CREATE TABLE "persona_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"display_name" text,
	"academic_identity" text,
	"research_passion" text,
	"learning_journey" text,
	"course_aspiration" text,
	"collaboration_style" text,
	"learning_preferences" text,
	"strengths" text,
	"growth_areas" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "persona_cards" ADD CONSTRAINT "persona_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;