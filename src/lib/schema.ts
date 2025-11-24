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
  manualReply: text('manual_reply'), // Manual reply from the persona owner
  isReplyFromOwner: boolean('is_reply_from_owner').default(false), // True if reply is from actual owner
  replyEditedAt: timestamp('reply_edited_at'), // When the reply was last edited
  createdAt: timestamp('created_at').defaultNow(),
});

export const personaInteractionLogs = pgTable('persona_interaction_logs', {
  id: serial('id').primaryKey(),
  personaUserId: integer('persona_user_id').references(() => users.id).notNull(), // User whose persona the interaction is on
  actorUserId: integer('actor_user_id').references(() => users.id).notNull(), // User who performed the action
  interactionType: text('interaction_type').notNull(), // Type of interaction
  targetId: integer('target_id'), // ID of the comment/reaction being acted upon
  details: text('details'), // JSON string with interaction details
  createdAt: timestamp('created_at').defaultNow(),
});

export const studentProjects = pgTable('student_projects', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  projectType: text('project_type').notNull(), // 'review', 'empirical', 'theory', 'reproducibility', 'others'
  projectDescription: text('project_description'), // Rich text content (HTML)
  version: integer('version').notNull().default(1), // Version number (1, 2, 3, etc.)
  isLatest: boolean('is_latest').default(true), // True for the most recent version
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Playground Conversations - Main conversation metadata
export const playgroundConversations = pgTable('playground_conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(), // User who initiated the conversation
  
  // Conversation metadata
  conversationType: text('conversation_type').notNull(), // 'dm' or 'group'
  userGoal: text('user_goal'), // User's stated goal for the conversation (optional)
  matchingReasoning: text('matching_reasoning'), // Why these specific agents were matched together
  
  // Participating agents (JSON array of persona IDs)
  participatingAgents: text('participating_agents').notNull(), // JSON array: [1, 5, 8, 12]
  
  // Memory pad - constantly updated summary of conversation
  memoryPad: text('memory_pad'), // AI-generated summary of key points discussed
  
  // Mindmap - tree structure of conversation topics (max 3 levels)
  conversationMindmap: text('conversation_mindmap'), // JSON tree structure of high-level topics discussed
  
  // Moderation settings
  moderationRule: text('moderation_rule'), // JSON object with moderation settings
  
  // Current speaker queue (JSON array)
  speakerQueue: text('speaker_queue'), // JSON array of {agentId, reasoning} objects
  
  // State tracking
  isEnded: boolean('is_ended').default(false),
  endedAt: timestamp('ended_at'),
  
  // Metadata
  totalUtterances: integer('total_utterances').default(0),
  lastActivityAt: timestamp('last_activity_at').defaultNow(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Playground Utterances - Individual messages in conversations
export const playgroundUtterances = pgTable('playground_utterances', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').references(() => playgroundConversations.id).notNull(),
  
  // Speaker information
  speakerId: integer('speaker_id'), // NULL for moderator, user ID or persona ID for others
  speakerType: text('speaker_type').notNull(), // 'user', 'agent', 'moderator', 'system'
  speakerName: text('speaker_name'), // Display name of speaker
  
  // Message content
  content: text('content').notNull(), // The actual message text
  
  // Context used for generation (for agent utterances)
  generationContext: text('generation_context'), // JSON object with context used
  
  // Metadata
  timestamp: timestamp('timestamp').defaultNow(),
  sequenceNumber: integer('sequence_number').notNull(), // Order in conversation
  
  createdAt: timestamp('created_at').defaultNow(),
});
