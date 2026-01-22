import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  playgroundConversations, 
} from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const conversationId = parseInt(id);

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
        error: 'Conversation has ended',
      }, { status: 400 });
    }

    // Get participating agents info
    let participatingAgentIds: number[] = [];
    try {
      const parsed = JSON.parse(conversation.participatingAgents);
      // Handle both array of numbers and array of objects (legacy support)
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === 'object') {
          participatingAgentIds = parsed.map((p: any) => p.userId);
        } else {
          participatingAgentIds = parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing participating agents:', e);
      return NextResponse.json({
        success: false,
        error: 'Invalid participating agents data',
      }, { status: 500 });
    }

    if (participatingAgentIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No participating agents found',
      }, { status: 400 });
    }

    // Randomly select 3-6 agents, allowing duplicates (mimicking active group chat with varied message lengths)
    const numSpeakers = Math.floor(Math.random() * 4) + 3; // Random number between 3 and 6
    const selectedAgents = [];
    
    for (let i = 0; i < numSpeakers; i++) {
        const randomAgentId = participatingAgentIds[Math.floor(Math.random() * participatingAgentIds.length)];
        selectedAgents.push({
            userId: randomAgentId,
            reasoning: 'Active group chat flow',
        });
    }

    console.log(`Generated random speaker queue of ${numSpeakers} agents (3-6 range):`, selectedAgents.map(a => a.userId));

    // Update speaker queue in database
    await db
      .update(playgroundConversations)
      .set({
        speakerQueue: JSON.stringify(selectedAgents),
        updatedAt: new Date(),
      })
      .where(eq(playgroundConversations.id, conversationId));

    return NextResponse.json({
      success: true,
      speakerQueue: selectedAgents,
    });
  } catch (error) {
    console.error('Error in moderation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to moderate conversation',
    }, { status: 500 });
  }
}
