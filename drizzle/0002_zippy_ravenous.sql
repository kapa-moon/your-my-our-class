CREATE TABLE "student_survey_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"preferred_name" text,
	"last_name" text,
	"gender" text,
	"age" text,
	"program" text,
	"experience" text,
	"skills" text,
	"coursework_projects" text,
	"current_topics" text,
	"motivations" text,
	"subtopics" text,
	"recent_readings" text,
	"takeaways" text,
	"reading_reasons" text,
	"class_reasons" text,
	"project_ideas" text,
	"goals" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "student_survey_responses" ADD CONSTRAINT "student_survey_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;