ALTER TABLE "personalized_papers" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "personalized_papers" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "personalized_papers" ALTER COLUMN "relevance_ranking" SET DATA TYPE integer;