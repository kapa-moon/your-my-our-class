import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

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
  avatarColor: text('avatar_color'),               // Avatar noise color preference
  
  // Sub-bullet data for persona card view (JSON strings)
  academicBackgroundSubBullets: text('academic_background_sub_bullets'), // JSON of sub-bullet points
  researchInterestSubBullets: text('research_interest_sub_bullets'),     // JSON of sub-bullet points
  recentReadingSubBullets: text('recent_reading_sub_bullets'),           // JSON of sub-bullet points
  learningGoalSubBullets: text('learning_goal_sub_bullets'),             // JSON of sub-bullet points
  
  // Introduction message for persona card
  introMessage: text('intro_message'),                                    // Self-introduction message
  
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

export const personalizedPapers = pgTable('personalized_papers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  paperID: text('paper_id').notNull(), // Semantic Scholar paper ID
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
  relevanceRanking: integer('relevance_ranking').notNull(), // 1-4 ranking for each week
  matchingReason: text('matching_reason'), // AI explanation for why this paper was selected
  keywords: text('keywords'), // comma-separated keywords (legacy)
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const interviewChats = pgTable('interview_chats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  
  // Raw chat history as JSON
  chatHistory: text('chat_history'), // JSON string of complete conversation
  
  // Interview status
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  
  // Extracted persona information (AI-processed from chat)
  extractedAcademicBackground: text('extracted_academic_background'),
  extractedResearchInterest: text('extracted_research_interest'),
  extractedRecentReading: text('extracted_recent_reading'),
  extractedLearningGoal: text('extracted_learning_goal'),
  extractedDiscussionStyle: text('extracted_discussion_style'),
  
  // Metadata
  totalMessages: integer('total_messages').default(0),
  sessionDuration: integer('session_duration'), // in minutes
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const presentablePersonas = pgTable('presentable_personas', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  
  // Header information
  name: text('name').notNull(),
  affiliation: text('affiliation'),
  
  // Left column content
  background: text('background'),
  discussionStyle: text('discussion_style'),
  
  // Right column content
  guidingQuestion: text('guiding_question'),
  learningGoals: text('learning_goals'),
  recentInterests: text('recent_interests'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const squareCardPositions = pgTable('square_card_positions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Position coordinates (in pixels or percentage)
  xPosition: integer('x_position').notNull(),
  yPosition: integer('y_position').notNull(),
  
  // Z-index for layering (if needed later)
  zIndex: integer('z_index').default(0),
  
  // Rotation angle for scattered effect (in degrees)
  rotation: integer('rotation').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const personaReactions = pgTable('persona_reactions', {
  id: serial('id').primaryKey(),
  personaUserId: integer('persona_user_id').references(() => users.id).notNull(), // User whose persona is being reacted to
  reactorUserId: integer('reactor_user_id').references(() => users.id).notNull(), // User who made the reaction
  emoji: text('emoji').notNull(), // The emoji reaction (👍, ❤️, etc.)
  createdAt: timestamp('created_at').defaultNow(),
});

export const personaComments = pgTable('persona_comments', {
  id: serial('id').primaryKey(),
  personaUserId: integer('persona_user_id').references(() => users.id).notNull(), // User whose persona is being commented on
  commenterUserId: integer('commenter_user_id').references(() => users.id).notNull(), // User who made the comment
  comment: text('comment').notNull(), // The comment text
  aiReply: text('ai_reply'), // AI-generated reply from the persona owner
  createdAt: timestamp('created_at').defaultNow(),
});
