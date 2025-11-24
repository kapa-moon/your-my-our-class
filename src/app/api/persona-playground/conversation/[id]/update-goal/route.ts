import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { playgroundConversations } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const conversationId = parseInt(id);
    const body = await request.json();
    const { userGoal } = body;

    // Get conversation
    const [conversation] = await db
      .select()
      .from(playgroundConversations)
      .where(eq(playgroundConversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      return NextResponse.json({
        success: false,
        error: 'Conversation not found',
      }, { status: 404 });
    }

    if (conversation.isEnded) {
      return NextResponse.json({
        success: false,
        error: 'Cannot update goal for ended conversation',
      }, { status: 400 });
    }

    // Update conversation goal
    await db
      .update(playgroundConversations)
      .set({
        userGoal: userGoal || null,
        updatedAt: new Date(),
      })
      .where(eq(playgroundConversations.id, conversationId));

    return NextResponse.json({
      success: true,
      userGoal: userGoal || null,
    });
  } catch (error) {
    console.error('Error updating conversation goal:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update conversation goal',
    }, { status: 500 });
  }
}

