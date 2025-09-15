CREATE TABLE "personalized_papers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"paper_id" text NOT NULL,
	"title" text NOT NULL,
	"authors" text,
	"abstract" text,
	"tldr" text,
	"topics" text,
	"embeddings" text,
	"doi" text,
	"open_access_pdf" text,
	"category" text NOT NULL,
	"url" text,
	"week_number" text NOT NULL,
	"week_topic" text NOT NULL,
	"relevance_ranking" serial NOT NULL,
	"matching_reason" text,
	"keywords" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "personalized_papers" ADD CONSTRAINT "personalized_papers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;