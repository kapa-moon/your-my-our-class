CREATE TABLE "square_card_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"x_position" integer NOT NULL,
	"y_position" integer NOT NULL,
	"z_index" integer DEFAULT 0,
	"rotation" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "square_card_positions" ADD CONSTRAINT "square_card_positions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;