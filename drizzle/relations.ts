import { relations } from "drizzle-orm/relations";
import { users, userSessions, studentSurveyResponses, personalizedPapers, personaCards, interviewChats, presentablePersonas } from "./schema";

export const userSessionsRelations = relations(userSessions, ({one}) => ({
	user: one(users, {
		fields: [userSessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	userSessions: many(userSessions),
	studentSurveyResponses: many(studentSurveyResponses),
	personalizedPapers: many(personalizedPapers),
	personaCards: many(personaCards),
	interviewChats: many(interviewChats),
	presentablePersonas: many(presentablePersonas),
}));

export const studentSurveyResponsesRelations = relations(studentSurveyResponses, ({one}) => ({
	user: one(users, {
		fields: [studentSurveyResponses.userId],
		references: [users.id]
	}),
}));

export const personalizedPapersRelations = relations(personalizedPapers, ({one}) => ({
	user: one(users, {
		fields: [personalizedPapers.userId],
		references: [users.id]
	}),
}));

export const personaCardsRelations = relations(personaCards, ({one}) => ({
	user: one(users, {
		fields: [personaCards.userId],
		references: [users.id]
	}),
}));

export const interviewChatsRelations = relations(interviewChats, ({one}) => ({
	user: one(users, {
		fields: [interviewChats.userId],
		references: [users.id]
	}),
}));

export const presentablePersonasRelations = relations(presentablePersonas, ({one}) => ({
	user: one(users, {
		fields: [presentablePersonas.userId],
		references: [users.id]
	}),
}));