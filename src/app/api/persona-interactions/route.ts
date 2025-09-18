import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { personaReactions, personaComments, users, personaCards } from '@/lib/schema';
import { 
  logReactionAdded, 
  logReactionRemoved, 
  logCommentPosted, 
  logAIReplyGenerated, 
  logReplyEditedByOwner, 
  logReplyDeletedByOwner 
} from '@/lib/interaction-logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GET: Fetch reactions and comments for a persona
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const personaUserId = searchParams.get('personaUserId');

    if (!personaUserId) {
      return NextResponse.json(
        { error: 'Persona user ID is required' },
        { status: 400 }
      );
    }

    // Fetch reactions with reactor persona names (preferred first names)
    const reactions = await db
      .select({
        id: personaReactions.id,
        emoji: personaReactions.emoji,
        reactorUserId: personaReactions.reactorUserId,
        reactorName: personaCards.name, // Use persona card name instead of user account name
        reactorUserName: users.name, // Fallback to user name if no persona
        createdAt: personaReactions.createdAt,
      })
      .from(personaReactions)
      .leftJoin(users, eq(personaReactions.reactorUserId, users.id))
      .leftJoin(personaCards, eq(personaReactions.reactorUserId, personaCards.userId))
      .where(eq(personaReactions.personaUserId, parseInt(personaUserId)))
      .orderBy(personaReactions.createdAt);

    // Fetch comments with commenter persona names (preferred first names)
    const comments = await db
      .select({
        id: personaComments.id,
        comment: personaComments.comment,
        aiReply: personaComments.aiReply,
        manualReply: personaComments.manualReply,
        isReplyFromOwner: personaComments.isReplyFromOwner,
        replyEditedAt: personaComments.replyEditedAt,
        commenterUserId: personaComments.commenterUserId,
        commenterName: personaCards.name, // Use persona card name instead of user account name
        commenterUserName: users.name, // Fallback to user name if no persona
        createdAt: personaComments.createdAt,
      })
      .from(personaComments)
      .leftJoin(users, eq(personaComments.commenterUserId, users.id))
      .leftJoin(personaCards, eq(personaComments.commenterUserId, personaCards.userId))
      .where(eq(personaComments.personaUserId, parseInt(personaUserId)))
      .orderBy(personaComments.createdAt);

    // Group reactions by emoji and count them
    const reactionSummary: { [emoji: string]: { count: number; users: string[] } } = {};
    reactions.forEach(reaction => {
      if (!reactionSummary[reaction.emoji]) {
        reactionSummary[reaction.emoji] = { count: 0, users: [] };
      }
      reactionSummary[reaction.emoji].count++;
      // Use persona name if available, otherwise fall back to user name
      const displayName = reaction.reactorName || reaction.reactorUserName;
      if (displayName) {
        reactionSummary[reaction.emoji].users.push(displayName);
      }
    });

    return NextResponse.json({
      success: true,
        data: {
          reactions: reactionSummary,
          comments: comments.map(comment => ({
            ...comment,
            commenterName: comment.commenterName || comment.commenterUserName, // Use persona name if available, otherwise user name
            currentReply: comment.manualReply || comment.aiReply, // Show manual reply if exists, otherwise AI reply
            replyType: comment.manualReply ? 'manual' : (comment.aiReply ? 'ai' : null)
          })),
        }
    });

  } catch (error) {
    console.error('Error fetching persona interactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Add reaction or comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, personaUserId, userId, emoji, comment, commentId, manualReply } = body;

    if (!type || !personaUserId || !userId) {
      return NextResponse.json(
        { error: 'Type, persona user ID, and user ID are required' },
        { status: 400 }
      );
    }

    if (type === 'reaction') {
      if (!emoji) {
        return NextResponse.json(
          { error: 'Emoji is required for reactions' },
          { status: 400 }
        );
      }

      // Check if user already reacted with this emoji
      const existingReaction = await db
        .select()
        .from(personaReactions)
        .where(
          and(
            eq(personaReactions.personaUserId, parseInt(personaUserId)),
            eq(personaReactions.reactorUserId, parseInt(userId)),
            eq(personaReactions.emoji, emoji)
          )
        )
        .limit(1);

      if (existingReaction.length > 0) {
        // Remove reaction if it exists (toggle behavior)
        await db
          .delete(personaReactions)
          .where(eq(personaReactions.id, existingReaction[0].id));

        // Log the reaction removal
        await logReactionRemoved(
          parseInt(personaUserId), 
          parseInt(userId), 
          emoji, 
          existingReaction[0].id
        );

        return NextResponse.json({
          success: true,
          message: 'Reaction removed',
          action: 'removed'
        });
      } else {
        // Add new reaction
        const newReaction = await db.insert(personaReactions).values({
          personaUserId: parseInt(personaUserId),
          reactorUserId: parseInt(userId),
          emoji: emoji,
        }).returning();

        // Log the reaction addition
        await logReactionAdded(
          parseInt(personaUserId), 
          parseInt(userId), 
          emoji, 
          newReaction[0].id
        );

        return NextResponse.json({
          success: true,
          message: 'Reaction added',
          action: 'added'
        });
      }

    } else if (type === 'comment') {
      if (!comment) {
        return NextResponse.json(
          { error: 'Comment text is required' },
          { status: 400 }
        );
      }

      // Get persona owner's COMPLETE data for AI reply (including sub-bullets)
      const personaOwner = await db
        .select({
          name: personaCards.name,
          academicBackground: personaCards.academicBackground,
          researchInterest: personaCards.researchInterest,
          recentReading: personaCards.recentReading,
          learningGoal: personaCards.learningGoal,
          discussionStyle: personaCards.discussionStyle,
          introMessage: personaCards.introMessage,
          // Include sub-bullets for richer context
          academicBackgroundSubBullets: personaCards.academicBackgroundSubBullets,
          researchInterestSubBullets: personaCards.researchInterestSubBullets,
          recentReadingSubBullets: personaCards.recentReadingSubBullets,
          learningGoalSubBullets: personaCards.learningGoalSubBullets,
        })
        .from(personaCards)
        .where(eq(personaCards.userId, parseInt(personaUserId)))
        .limit(1);

      // Get ALL previous comments and replies for conversation context with enhanced user info
      const conversationHistory = await db
        .select({
          comment: personaComments.comment,
          aiReply: personaComments.aiReply,
          manualReply: personaComments.manualReply,
          commenterName: personaCards.name,
          commenterUserName: users.name,
          commenterUserId: personaComments.commenterUserId,
          commentId: personaComments.id,
          createdAt: personaComments.createdAt,
          // Get commenter's basic persona info for better context
          commenterResearchInterest: personaCards.researchInterest,
          commenterAcademicBackground: personaCards.academicBackground,
        })
        .from(personaComments)
        .leftJoin(users, eq(personaComments.commenterUserId, users.id))
        .leftJoin(personaCards, eq(personaComments.commenterUserId, personaCards.userId))
        .where(eq(personaComments.personaUserId, parseInt(personaUserId)))
        .orderBy(personaComments.createdAt);

      if (personaOwner.length === 0) {
        return NextResponse.json(
          { error: 'Persona not found' },
          { status: 404 }
        );
      }

      const persona = personaOwner[0];

      // Parse sub-bullets if they exist
      const parseSubBullets = (subBulletsStr: string | null) => {
        if (!subBulletsStr) return [];
        try {
          return JSON.parse(subBulletsStr).filter((bullet: any) => bullet.content && bullet.content.trim());
        } catch {
          return [];
        }
      };

      const academicSubBullets = parseSubBullets(persona.academicBackgroundSubBullets);
      const researchSubBullets = parseSubBullets(persona.researchInterestSubBullets);
      const readingSubBullets = parseSubBullets(persona.recentReadingSubBullets);
      const goalSubBullets = parseSubBullets(persona.learningGoalSubBullets);

      // Format conversation history for enhanced context awareness
      const historyContext = conversationHistory.length > 0 
        ? conversationHistory.map((h, index) => {
            const commenterName = h.commenterName || h.commenterUserName || 'Someone';
            const reply = h.manualReply || h.aiReply;
            
            // Add commenter context if available
            let commenterContext = '';
            if (h.commenterName && (h.commenterResearchInterest || h.commenterAcademicBackground)) {
              const interests = h.commenterResearchInterest ? ` (Research: ${h.commenterResearchInterest.substring(0, 100)})` : '';
              const background = h.commenterAcademicBackground ? ` (Background: ${h.commenterAcademicBackground.substring(0, 100)})` : '';
              commenterContext = interests || background;
            }
            
            // Format with enhanced context
            const commentEntry = `[Comment ${index + 1}] ${commenterName}${commenterContext}: "${h.comment}"`;
            const replyEntry = reply ? `\n[Your Reply ${index + 1}] ${persona.name}: "${reply}"` : '';
            
            return commentEntry + replyEntry;
          }).join('\n\n')
        : 'This is the first comment on your persona card.';

      // Enhanced system prompt with few-shot examples
      const systemPrompt = `You are an AI assistant helping to generate persona responses for academic students. The persona should respond in a professional but friendly, welcoming tone. Here are examples of good responses:

Example 1:
Comment: "I love your research on NLP!"
Good Response: "Thank you! I'm excited to explore how language models can better understand context in conversations."

Example 2: 
Comment: "Your background in psychology is fascinating!"
Good Response: "Thanks! I'm particularly interested in how cognitive biases affect our interaction with AI systems."

Example 3:
Comment: "We should collaborate on something!"
Good Response: "I'd love that! Maybe we could explore the intersection of your design work and my research on user behavior."

Style guidelines:
- Professional but not overly formal
- Welcoming and enthusiastic
- Reference specific aspects of your research/interests when relevant
- Show curiosity about potential connections
- Keep responses conversational and authentic`;

      // Enhanced user prompt with full context awareness
      const aiPrompt = `You are ${persona.name}, responding to a comment on your academic persona card.

=== YOUR COMPLETE PERSONA ===
Name: ${persona.name}
Intro Message: ${persona.introMessage || 'Not specified'}

Academic Background: ${persona.academicBackground || 'Not specified'}
${academicSubBullets.length > 0 ? academicSubBullets.map((b: any) => `  • ${b.content}`).join('\n') : ''}

Research Interest: ${persona.researchInterest || 'Not specified'}
${researchSubBullets.length > 0 ? researchSubBullets.map((b: any) => `  • ${b.content}`).join('\n') : ''}

Recent Reading/Thoughts: ${persona.recentReading || 'Not specified'}
${readingSubBullets.length > 0 ? readingSubBullets.map((b: any) => `  • ${b.content}`).join('\n') : ''}

Learning Goal: ${persona.learningGoal || 'Not specified'}
${goalSubBullets.length > 0 ? goalSubBullets.map((b: any) => `  • ${b.content}`).join('\n') : ''}

Discussion Style: ${persona.discussionStyle || 'Not specified'}

=== COMPLETE CONVERSATION HISTORY ===
${historyContext}

=== NEW COMMENT TO RESPOND TO ===
Someone just commented: "${comment}"

IMPORTANT CONTEXT AWARENESS INSTRUCTIONS:
- Review the ENTIRE conversation history above to understand ongoing discussions
- Reference previous comments/replies when relevant to show continuity
- Build upon themes, topics, or connections mentioned in earlier exchanges
- If this relates to a previous conversation thread, acknowledge that connection
- Be aware of who has commented before and their backgrounds/interests

Respond as ${persona.name} in ONE sentence that:
1. Shows awareness of the conversation history and any ongoing themes
2. Reflects your personality and academic interests
3. Is professional but friendly and welcoming
4. Shows engagement with both the new comment AND conversation context
5. Could reference relevant aspects of your research/background if appropriate
6. Demonstrates conversational continuity and memory

Response (one sentence only):`;

      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: aiPrompt }
        ],
        max_tokens: 200, // Increased to allow for more contextually aware responses
        temperature: 0.7, // Balanced for consistency with context awareness
      });

      const aiReply = aiResponse.choices[0]?.message?.content?.trim() || `Thanks for the comment! 😊`;

      // Insert comment with AI reply
      const newComment = await db.insert(personaComments).values({
        personaUserId: parseInt(personaUserId),
        commenterUserId: parseInt(userId),
        comment: comment,
        aiReply: aiReply,
      }).returning();

      // Log the comment posting
      await logCommentPosted(
        parseInt(personaUserId), 
        parseInt(userId), 
        newComment[0].id, 
        comment
      );

      // Log the AI reply generation
      await logAIReplyGenerated(
        parseInt(personaUserId), 
        newComment[0].id, 
        aiReply
      );

      return NextResponse.json({
        success: true,
        message: 'Comment added',
        data: {
          id: newComment[0].id,
          comment: comment,
          aiReply: aiReply,
          createdAt: newComment[0].createdAt,
        }
      });

    } else if (type === 'edit_reply') {
      if (!commentId || !manualReply) {
        return NextResponse.json(
          { error: 'Comment ID and manual reply are required' },
          { status: 400 }
        );
      }

      // Verify the user owns this persona
      const comment = await db
        .select()
        .from(personaComments)
        .where(eq(personaComments.id, parseInt(commentId)))
        .limit(1);

      if (comment.length === 0) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      if (comment[0].personaUserId !== parseInt(userId)) {
        return NextResponse.json(
          { error: 'You can only edit replies on your own persona' },
          { status: 403 }
        );
      }

      // Get the old reply for logging
      const oldReply = comment[0].manualReply || comment[0].aiReply || '';

      // Update with manual reply
      await db
        .update(personaComments)
        .set({
          manualReply: manualReply.trim(),
          isReplyFromOwner: true,
          replyEditedAt: new Date(),
        })
        .where(eq(personaComments.id, parseInt(commentId)));

      // Log the reply edit
      await logReplyEditedByOwner(
        parseInt(personaUserId), 
        parseInt(commentId), 
        oldReply, 
        manualReply.trim()
      );

      return NextResponse.json({
        success: true,
        message: 'Reply updated',
      });

    } else if (type === 'delete_reply') {
      if (!commentId) {
        return NextResponse.json(
          { error: 'Comment ID is required' },
          { status: 400 }
        );
      }

      // Verify the user owns this persona
      const comment = await db
        .select()
        .from(personaComments)
        .where(eq(personaComments.id, parseInt(commentId)))
        .limit(1);

      if (comment.length === 0) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      if (comment[0].personaUserId !== parseInt(userId)) {
        return NextResponse.json(
          { error: 'You can only delete replies on your own persona' },
          { status: 403 }
        );
      }

      // Get the reply being deleted for logging
      const deletedReply = comment[0].manualReply || comment[0].aiReply || '';

      // Clear both AI and manual replies
      await db
        .update(personaComments)
        .set({
          aiReply: null,
          manualReply: null,
          isReplyFromOwner: false,
          replyEditedAt: new Date(),
        })
        .where(eq(personaComments.id, parseInt(commentId)));

      // Log the reply deletion
      await logReplyDeletedByOwner(
        parseInt(personaUserId), 
        parseInt(commentId), 
        deletedReply
      );

      return NextResponse.json({
        success: true,
        message: 'Reply deleted',
      });
    }

    return NextResponse.json(
      { error: 'Invalid interaction type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error adding persona interaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
