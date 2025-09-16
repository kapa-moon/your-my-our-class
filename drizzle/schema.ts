import { pgTable, serial, text, boolean, timestamp, foreignKey, unique, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	passwordHash: text("password_hash"),
	isGuest: boolean("is_guest").default(false),
	sessionId: text("session_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	lastActiveAt: timestamp("last_active_at", { mode: 'string' }).defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
	id: serial().primaryKey().notNull(),
	userId: serial("user_id").notNull(),
	sessionData: text("session_data"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_sessions_user_id_users_id_fk"
		}),
]);

export const studentSurveyResponses = pgTable("student_survey_responses", {
	id: serial().primaryKey().notNull(),
	userId: serial("user_id").notNull(),
	preferredName: text("preferred_name"),
	lastName: text("last_name"),
	gender: text(),
	age: text(),
	recentReadings: text("recent_readings"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	academicBackground: text("academic_background"),
	researchInterests: text("research_interests"),
	classGoals: text("class_goals"),
	discussionStyle: text("discussion_style"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "student_survey_responses_user_id_users_id_fk"
		}),
]);

export const papers = pgTable("papers", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	authors: text(),
	abstract: text(),
	url: text(),
	keywords: text(),
	topics: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	paperId: text("paper_id").notNull(),
	tldr: text(),
	embeddings: text(),
	doi: text(),
	openAccessPdf: text("open_access_pdf"),
	category: text().notNull(),
}, (table) => [
	unique("papers_paper_id_unique").on(table.paperId),
]);

export const requiredPapers = pgTable("required_papers", {
	id: serial().primaryKey().notNull(),
	paperId: text("paper_id").notNull(),
	title: text().notNull(),
	authors: text(),
	abstract: text(),
	tldr: text(),
	topics: text(),
	embeddings: text(),
	doi: text(),
	openAccessPdf: text("open_access_pdf"),
	category: text().notNull(),
	url: text(),
	weekNumber: text("week_number").notNull(),
	weekTopic: text("week_topic").notNull(),
	keywords: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("required_papers_paper_id_unique").on(table.paperId),
]);

export const personalizedPapers = pgTable("personalized_papers", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	paperId: text("paper_id").notNull(),
	title: text().notNull(),
	authors: text(),
	abstract: text(),
	tldr: text(),
	topics: text(),
	embeddings: text(),
	doi: text(),
	openAccessPdf: text("open_access_pdf"),
	category: text().notNull(),
	url: text(),
	weekNumber: text("week_number").notNull(),
	weekTopic: text("week_topic").notNull(),
	relevanceRanking: integer("relevance_ranking").notNull(),
	matchingReason: text("matching_reason"),
	keywords: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "personalized_papers_user_id_users_id_fk"
		}),
]);

export const personaCards = pgTable("persona_cards", {
	id: serial().primaryKey().notNull(),
	userId: serial("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	name: text(),
	academicBackground: text("academic_background"),
	researchInterest: text("research_interest"),
	recentReading: text("recent_reading"),
	learningGoal: text("learning_goal"),
	discussionStyle: text("discussion_style"),
	avatarColor: text("avatar_color"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "persona_cards_user_id_users_id_fk"
		}),
]);

export const interviewChats = pgTable("interview_chats", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	chatHistory: text("chat_history"),
	isCompleted: boolean("is_completed").default(false),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	extractedAcademicBackground: text("extracted_academic_background"),
	extractedResearchInterest: text("extracted_research_interest"),
	extractedRecentReading: text("extracted_recent_reading"),
	extractedLearningGoal: text("extracted_learning_goal"),
	extractedDiscussionStyle: text("extracted_discussion_style"),
	totalMessages: integer("total_messages").default(0),
	sessionDuration: integer("session_duration"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "interview_chats_user_id_users_id_fk"
		}),
]);

export const presentablePersonas = pgTable("presentable_personas", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	name: text().notNull(),
	affiliation: text(),
	background: text(),
	discussionStyle: text("discussion_style"),
	guidingQuestion: text("guiding_question"),
	learningGoals: text("learning_goals"),
	recentInterests: text("recent_interests"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "presentable_personas_user_id_users_id_fk"
		}),
]);
