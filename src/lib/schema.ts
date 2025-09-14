import { pgTable, serial, text, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  passwordHash: text('password_hash'), // null for guest users
  isGuest: boolean('is_guest').default(false),
  sessionId: text('session_id'), // for guest session tracking
  createdAt: timestamp('created_at').defaultNow(),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
});

export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  sessionData: text('session_data'), // JSON string for logging
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
});

export const papers = pgTable('papers', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  authors: text('authors'), // comma-separated or JSON string
  abstract: text('abstract'),
  url: text('url'),
  keywords: text('keywords'), // comma-separated keywords
  professorIntent: text('professor_intent'), // why the professor included this paper
  topics: text('topics'), // comma-separated topics/themes
  professorName: varchar('professor_name', { length: 100 }), // who suggested it
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const studentSurveyResponses = pgTable('student_survey_responses', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  
  // 1. Basics
  preferredName: text('preferred_name'),
  lastName: text('last_name'),
  gender: text('gender'),
  age: text('age'),
  
  // 2. Comprehensive Questions
  academicBackground: text('academic_background'), // Combined: program, experience, skills, coursework
  researchInterests: text('research_interests'),   // Combined: topics, motivations, subtopics
  recentReadings: text('recent_readings'),         // Combined: readings, takeaways, reasons
  classGoals: text('class_goals'),                 // Combined: reasons, project ideas, goals
  discussionStyle: text('discussion_style'),       // New: class participation preferences
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const personaCards = pgTable('persona_cards', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  
  // Simplified Persona Card Fields (6 fields only)
  name: text('name'),                              // Name (was displayName)
  academicBackground: text('academic_background'), // Academic Background (was academicIdentity)
  researchInterest: text('research_interest'),     // Research Interest (was researchPassion)
  recentReading: text('recent_reading'),           // Recent Reading/Thoughts (was learningJourney)
  learningGoal: text('learning_goal'),             // Learning Goal for the Class (was courseAspiration)
  discussionStyle: text('discussion_style'),       // Discussion Style (was collaborationStyle)
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
