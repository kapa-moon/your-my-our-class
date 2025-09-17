import { db } from './db';
import { personaInteractionLogs } from './schema';

// Types of interactions we track
export type InteractionType = 
  | 'reaction_added'
  | 'reaction_removed'
  | 'comment_posted'
  | 'ai_reply_generated'
  | 'reply_edited_by_owner'
  | 'reply_deleted_by_owner'
  | 'manual_reply_added';

// Log an interaction to the database
export async function logPersonaInteraction(
  personaUserId: number,
  actorUserId: number,
  interactionType: InteractionType,
  targetId?: number,
  details?: any
) {
  try {
    await db.insert(personaInteractionLogs).values({
      personaUserId,
      actorUserId,
      interactionType,
      targetId: targetId || null,
      details: details ? JSON.stringify(details) : null,
    });
  } catch (error) {
    console.error('Error logging persona interaction:', error);
    // Don't throw - logging failures shouldn't break the main functionality
  }
}

// Helper functions for specific interaction types
export const logReactionAdded = (personaUserId: number, actorUserId: number, emoji: string, reactionId?: number) =>
  logPersonaInteraction(personaUserId, actorUserId, 'reaction_added', reactionId, { emoji });

export const logReactionRemoved = (personaUserId: number, actorUserId: number, emoji: string, reactionId?: number) =>
  logPersonaInteraction(personaUserId, actorUserId, 'reaction_removed', reactionId, { emoji });

export const logCommentPosted = (personaUserId: number, actorUserId: number, commentId: number, comment: string) =>
  logPersonaInteraction(personaUserId, actorUserId, 'comment_posted', commentId, { comment });

export const logAIReplyGenerated = (personaUserId: number, commentId: number, aiReply: string) =>
  logPersonaInteraction(personaUserId, personaUserId, 'ai_reply_generated', commentId, { aiReply });

export const logReplyEditedByOwner = (personaUserId: number, commentId: number, oldReply: string, newReply: string) =>
  logPersonaInteraction(personaUserId, personaUserId, 'reply_edited_by_owner', commentId, { oldReply, newReply });

export const logReplyDeletedByOwner = (personaUserId: number, commentId: number, deletedReply: string) =>
  logPersonaInteraction(personaUserId, personaUserId, 'reply_deleted_by_owner', commentId, { deletedReply });

export const logManualReplyAdded = (personaUserId: number, commentId: number, manualReply: string) =>
  logPersonaInteraction(personaUserId, personaUserId, 'manual_reply_added', commentId, { manualReply });
