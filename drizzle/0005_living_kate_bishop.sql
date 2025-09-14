ALTER TABLE "persona_cards" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "persona_cards" ADD COLUMN "academic_background" text;--> statement-breakpoint
ALTER TABLE "persona_cards" ADD COLUMN "research_interest" text;--> statement-breakpoint
ALTER TABLE "persona_cards" ADD COLUMN "recent_reading" text;--> statement-breakpoint
ALTER TABLE "persona_cards" ADD COLUMN "learning_goal" text;--> statement-breakpoint
ALTER TABLE "persona_cards" ADD COLUMN "discussion_style" text;--> statement-breakpoint
ALTER TABLE "persona_cards" DROP COLUMN "display_name";--> statement-breakpoint
ALTER TABLE "persona_cards" DROP COLUMN "academic_identity";--> statement-breakpoint
ALTER TABLE "persona_cards" DROP COLUMN "research_passion";--> statement-breakpoint
ALTER TABLE "persona_cards" DROP COLUMN "learning_journey";--> statement-breakpoint
ALTER TABLE "persona_cards" DROP COLUMN "course_aspiration";--> statement-breakpoint
ALTER TABLE "persona_cards" DROP COLUMN "collaboration_style";--> statement-breakpoint
ALTER TABLE "persona_cards" DROP COLUMN "learning_preferences";--> statement-breakpoint
ALTER TABLE "persona_cards" DROP COLUMN "strengths";--> statement-breakpoint
ALTER TABLE "persona_cards" DROP COLUMN "growth_areas";