ALTER TABLE "student_survey_responses" ADD COLUMN "academic_background" text;--> statement-breakpoint
ALTER TABLE "student_survey_responses" ADD COLUMN "research_interests" text;--> statement-breakpoint
ALTER TABLE "student_survey_responses" ADD COLUMN "class_goals" text;--> statement-breakpoint
ALTER TABLE "student_survey_responses" ADD COLUMN "discussion_style" text;--> statement-breakpoint
ALTER TABLE "student_survey_responses" DROP COLUMN "program";--> statement-breakpoint
ALTER TABLE "student_survey_responses" DROP COLUMN "experience";--> statement-breakpoint
ALTER TABLE "student_survey_responses" DROP COLUMN "skills";--> statement-breakpoint
ALTER TABLE "student_survey_responses" DROP COLUMN "coursework_projects";--> statement-breakpoint
ALTER TABLE "student_survey_responses" DROP COLUMN "current_topics";--> statement-breakpoint
ALTER TABLE "student_survey_responses" DROP COLUMN "motivations";--> statement-breakpoint
ALTER TABLE "student_survey_responses" DROP COLUMN "subtopics";--> statement-breakpoint
ALTER TABLE "student_survey_responses" DROP COLUMN "takeaways";--> statement-breakpoint
ALTER TABLE "student_survey_responses" DROP COLUMN "reading_reasons";--> statement-breakpoint
ALTER TABLE "student_survey_responses" DROP COLUMN "class_reasons";--> statement-breakpoint
ALTER TABLE "student_survey_responses" DROP COLUMN "project_ideas";--> statement-breakpoint
ALTER TABLE "student_survey_responses" DROP COLUMN "goals";