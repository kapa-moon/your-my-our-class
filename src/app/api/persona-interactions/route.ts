import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { personaReactions, personaComments, users, personaCards } from '@/lib/schema';

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
            commenterName: comment.commenterName || comment.commenterUserName // Use persona name if available, otherwise user name
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
    const { type, personaUserId, userId, emoji, comment } = body;

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

        return NextResponse.json({
          success: true,
          message: 'Reaction removed',
          action: 'removed'
        });
      } else {
        // Add new reaction
        await db.insert(personaReactions).values({
          personaUserId: parseInt(personaUserId),
          reactorUserId: parseInt(userId),
          emoji: emoji,
        });

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

      // Get persona owner's data for AI reply
      const personaOwner = await db
        .select({
          name: personaCards.name,
          academicBackground: personaCards.academicBackground,
          researchInterest: personaCards.researchInterest,
          recentReading: personaCards.recentReading,
          learningGoal: personaCards.learningGoal,
          discussionStyle: personaCards.discussionStyle,
          introMessage: personaCards.introMessage,
        })
        .from(personaCards)
        .where(eq(personaCards.userId, parseInt(personaUserId)))
        .limit(1);

      if (personaOwner.length === 0) {
        return NextResponse.json(
          { error: 'Persona not found' },
          { status: 404 }
        );
      }

      const persona = personaOwner[0];

      // Generate AI reply using the persona's characteristics
      const aiPrompt = `You are ${persona.name}, responding to a comment on your persona card. 

Your persona characteristics:
- Academic Background: ${persona.academicBackground}
- Research Interest: ${persona.researchInterest}
- Recent Reading/Thoughts: ${persona.recentReading}
- Learning Goal: ${persona.learningGoal}
- Discussion Style: ${persona.discussionStyle}
- Intro Message: ${persona.introMessage}

Someone commented on your persona card: "${comment}"

Respond as ${persona.name} in ONE concise sentence that reflects your personality and academic interests. Be warm, authentic, and engaging. Keep it under 100 characters.`;

      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are responding as an academic persona. Be concise, authentic, and engaging.' },
          { role: 'user', content: aiPrompt }
        ],
        max_tokens: 50,
        temperature: 0.7,
      });

      const aiReply = aiResponse.choices[0]?.message?.content?.trim() || `Thanks for the comment! 😊`;

      // Insert comment with AI reply
      const newComment = await db.insert(personaComments).values({
        personaUserId: parseInt(personaUserId),
        commenterUserId: parseInt(userId),
        comment: comment,
        aiReply: aiReply,
      }).returning();

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
