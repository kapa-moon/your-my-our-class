CREATE TABLE "papers" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"authors" text,
	"abstract" text,
	"url" text,
	"keywords" text,
	"professor_intent" text,
	"topics" text,
	"professor_name" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
