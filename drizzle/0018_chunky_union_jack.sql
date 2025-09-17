CREATE TABLE "persona_interaction_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"persona_user_id" integer NOT NULL,
	"actor_user_id" integer NOT NULL,
	"interaction_type" text NOT NULL,
	"target_id" integer,
	"details" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "persona_interaction_logs" ADD CONSTRAINT "persona_interaction_logs_persona_user_id_users_id_fk" FOREIGN KEY ("persona_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_interaction_logs" ADD CONSTRAINT "persona_interaction_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;