import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { playgroundConversations, playgroundUtterances, presentablePersonas, personaCards } from '@/lib/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export async function GET(
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

    // Get all utterances for this conversation
    let utterances;
    try {
      utterances = await db
        .select()
        .from(playgroundUtterances)
        .where(eq(playgroundUtterances.conversationId, conversationId))
        .orderBy(playgroundUtterances.sequenceNumber);
      
      console.log('Loaded utterances:', utterances?.length || 0);
    } catch (utteranceError) {
      console.error('Failed to load utterances:', utteranceError);
      utterances = [];
    }

    // Get participating agents info
    console.log('Raw participatingAgents from DB:', conversation.participatingAgents);
    
    let participatingAgentIds: number[] = [];
    try {
      const parsed = JSON.parse(conversation.participatingAgents || '[]');
      console.log('Parsed participatingAgents:', parsed);
      
      if (!Array.isArray(parsed)) {
        console.error('participatingAgents is not an array:', parsed);
        return NextResponse.json({
          success: false,
          error: 'Invalid conversation data format',
        }, { status: 500 });
      }
      
      participatingAgentIds = parsed.filter(id => typeof id === 'number' && !isNaN(id));
      console.log('Filtered participatingAgentIds:', participatingAgentIds);
      
    } catch (parseError) {
      console.error('Failed to parse participatingAgents:', conversation.participatingAgents, parseError);
      return NextResponse.json({
        success: false,
        error: 'Invalid conversation data',
      }, { status: 500 });
    }
    
    if (participatingAgentIds.length === 0) {
      console.error('No valid participating agent IDs found for conversation:', conversationId);
      return NextResponse.json({
        success: false,
        error: 'No participating agents in conversation',
      }, { status: 500 });
    }
    
    console.log('Querying for agent personas with userIds:', participatingAgentIds);
    
    // Query for agent personas and their avatar colors
    let agentsInfo: any[] = [];
    try {
      // Get persona cards (which have the name and avatar color)
      const cards = await db
        .select({
          userId: personaCards.userId,
          name: personaCards.name,
          avatarColor: personaCards.avatarColor,
        })
        .from(personaCards)
        .where(inArray(personaCards.userId, participatingAgentIds));
      
      console.log('Persona cards for agents:', cards?.length, cards);
      
      // Get presentable personas (for id, but not required)
      const personas = await db
        .select({
          id: presentablePersonas.id,
          userId: presentablePersonas.userId,
        })
        .from(presentablePersonas)
        .where(inArray(presentablePersonas.userId, participatingAgentIds));
      
      console.log('Presentable personas for agents:', personas?.length);
      
      // Create a map of userId to presentable persona id
      const personaIdMap = new Map(personas.map(p => [p.userId, p.id]));
      
      // Build agentsInfo from persona cards
      agentsInfo = cards
        .filter(c => c.userId && c.name && c.name.trim() !== '') // Only include cards with valid names
        .map(c => ({
          id: personaIdMap.get(c.userId!) || 0,
          userId: c.userId!,
          name: c.name!,
          avatarColor: c.avatarColor || '#808080',
        }));
      
      console.log('Built agentsInfo from cards:', agentsInfo?.length, agentsInfo);
      
      // If we still don't have all agents, check which ones are missing
      const foundUserIds = new Set(agentsInfo.map(a => a.userId));
      const missingUserIds = participatingAgentIds.filter(id => !foundUserIds.has(id));
      
      if (missingUserIds.length > 0) {
        console.warn('Missing persona cards for userIds:', missingUserIds);
        // Add placeholder agents for missing ones
        const placeholders = missingUserIds.map(userId => ({
          id: 0,
          userId: userId,
          name: `User ${userId}`,
          avatarColor: '#808080',
        }));
        agentsInfo.push(...placeholders);
      }
      
    } catch (queryError) {
      console.error('Failed to query agent personas:', queryError);
      return NextResponse.json({
        success: false,
        error: 'Failed to load agent data',
      }, { status: 500 });
    }

    if (!agentsInfo || agentsInfo.length === 0) {
      console.error('No agent personas found for userIds:', participatingAgentIds);
      return NextResponse.json({
        success: false,
        error: 'No valid agents found',
      }, { status: 500 });
    }

    // Parse speaker queue
    let speakerQueue = [];
    try {
      speakerQueue = conversation.speakerQueue ? JSON.parse(conversation.speakerQueue) : [];
    } catch (queueError) {
      console.error('Failed to parse speaker queue:', queueError);
      speakerQueue = [];
    }

    console.log('Conversation loaded successfully:', {
      id: conversationId,
      agentsCount: agentsInfo?.length,
      utterancesCount: utterances?.length,
      speakerQueueCount: speakerQueue?.length,
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        userId: conversation.userId,
        conversationType: conversation.conversationType,
        userGoal: conversation.userGoal || null,
        matchingReasoning: conversation.matchingReasoning || null,
        isEnded: conversation.isEnded || false,
        createdAt: conversation.createdAt,
        participatingAgents: agentsInfo || [],
        speakerQueue: speakerQueue || [],
        memoryPad: conversation.memoryPad || '',
        conversationMindmap: conversation.conversationMindmap || '',
      },
      utterances: (utterances || []).filter(u => u != null).map(u => ({
        id: u.id,
        speakerId: u.speakerId,
        speakerType: u.speakerType,
        speakerName: u.speakerName,
        content: u.content,
        timestamp: u.createdAt,
        sequenceNumber: u.sequenceNumber,
      })),
    });
  } catch (error) {
    console.error('Error loading conversation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load conversation',
    }, { status: 500 });
  }
}

// End conversation
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const conversationId = parseInt(id);

    await db
      .update(playgroundConversations)
      .set({
        isEnded: true,
        updatedAt: new Date(),
      })
      .where(eq(playgroundConversations.id, conversationId));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error ending conversation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to end conversation',
    }, { status: 500 });
  }
}
