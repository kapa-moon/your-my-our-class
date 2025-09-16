CREATE TABLE "persona_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"persona_user_id" integer NOT NULL,
	"commenter_user_id" integer NOT NULL,
	"comment" text NOT NULL,
	"ai_reply" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "persona_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"persona_user_id" integer NOT NULL,
	"reactor_user_id" integer NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "persona_comments" ADD CONSTRAINT "persona_comments_persona_user_id_users_id_fk" FOREIGN KEY ("persona_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_comments" ADD CONSTRAINT "persona_comments_commenter_user_id_users_id_fk" FOREIGN KEY ("commenter_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_reactions" ADD CONSTRAINT "persona_reactions_persona_user_id_users_id_fk" FOREIGN KEY ("persona_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_reactions" ADD CONSTRAINT "persona_reactions_reactor_user_id_users_id_fk" FOREIGN KEY ("reactor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;