import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { playgroundConversations, playgroundUtterances } from '@/lib/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, conversationType, userGoal, participatingAgents, matchingReasoning } = body;

    // Validate input
    if (!userId || !conversationType || !participatingAgents || participatingAgents.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
      }, { status: 400 });
    }

    // Validate conversation type
    if (conversationType !== 'dm' && conversationType !== 'group') {
      return NextResponse.json({
        success: false,
        error: 'Invalid conversation type. Must be "dm" or "group"',
      }, { status: 400 });
    }

    // Create conversation
    const [conversation] = await db.insert(playgroundConversations).values({
      userId: parseInt(userId),
      conversationType,
      userGoal: userGoal || null,
      matchingReasoning: matchingReasoning || null,
      participatingAgents: JSON.stringify(participatingAgents),
      memoryPad: '', // Initialize empty
      moderationRule: JSON.stringify({
        maxQueueSize: 3,
        considerRelevance: true,
        allowRepeat: false,
      }),
      speakerQueue: JSON.stringify([]), // Initialize empty queue
      isEnded: false,
      totalUtterances: 0,
    }).returning();

    // Add initial system message
    await db.insert(playgroundUtterances).values({
      conversationId: conversation.id,
      speakerId: null,
      speakerType: 'system',
      speakerName: 'System',
      content: 'Conversation started',
      sequenceNumber: 0,
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        userId: conversation.userId,
        conversationType: conversation.conversationType,
        userGoal: conversation.userGoal,
        matchingReasoning: conversation.matchingReasoning,
        participatingAgents: JSON.parse(conversation.participatingAgents),
        speakerQueue: [],
        isEnded: conversation.isEnded,
      },
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create conversation',
    }, { status: 500 });
  }
}

