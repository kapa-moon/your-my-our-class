ALTER TABLE "papers" ADD COLUMN "paper_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "papers" ADD COLUMN "tldr" text;--> statement-breakpoint
ALTER TABLE "papers" ADD COLUMN "embeddings" text;--> statement-breakpoint
ALTER TABLE "papers" ADD COLUMN "doi" text;--> statement-breakpoint
ALTER TABLE "papers" ADD COLUMN "open_access_pdf" text;--> statement-breakpoint
ALTER TABLE "papers" ADD COLUMN "category" text NOT NULL;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_paper_id_unique" UNIQUE("paper_id");