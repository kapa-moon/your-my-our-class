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
  paperID: text('paper_id').notNull().unique(), // Semantic Scholar paper ID
  title: text('title').notNull(),
  authors: text('authors'), // comma-separated author names
  abstract: text('abstract'),
  tldr: text('tldr'), // TL;DR summary from Semantic Scholar
  topics: text('topics'), // comma-separated topics/fields of study
  embeddings: text('embeddings'), // JSON string of embedding vector
  doi: text('doi'), // DOI link
  openAccessPdf: text('open_access_pdf'), // Open access PDF URL if available
  category: text('category').notNull(), // Course category/classification
  url: text('url'), // Semantic Scholar URL
  keywords: text('keywords'), // comma-separated keywords (legacy)
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

export const requiredPapers = pgTable('required_papers', {
  id: serial('id').primaryKey(),
  paperID: text('paper_id').notNull().unique(), // Semantic Scholar paper ID
  title: text('title').notNull(),
  authors: text('authors'), // comma-separated author names
  abstract: text('abstract'),
  tldr: text('tldr'), // TL;DR summary from Semantic Scholar
  topics: text('topics'), // comma-separated topics/fields of study
  embeddings: text('embeddings'), // JSON string of embedding vector
  doi: text('doi'), // DOI link
  openAccessPdf: text('open_access_pdf'), // Open access PDF URL if available
  category: text('category').notNull(), // Course category/classification
  url: text('url'), // Semantic Scholar URL
  weekNumber: text('week_number').notNull(), // Week number (2, 3, 4, etc.)
  weekTopic: text('week_topic').notNull(), // Week topic (e.g., "AI-Mediated Communication")
  keywords: text('keywords'), // comma-separated keywords (legacy)
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
