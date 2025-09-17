import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { personaInteractionLogs, users, personaCards } from '@/lib/schema';

// GET: Retrieve interaction logs for a persona
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const personaUserId = searchParams.get('personaUserId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!personaUserId) {
      return NextResponse.json(
        { error: 'Persona user ID is required' },
        { status: 400 }
      );
    }

    // Fetch interaction logs with actor names
    const logs = await db
      .select({
        id: personaInteractionLogs.id,
        interactionType: personaInteractionLogs.interactionType,
        targetId: personaInteractionLogs.targetId,
        details: personaInteractionLogs.details,
        createdAt: personaInteractionLogs.createdAt,
        actorUserId: personaInteractionLogs.actorUserId,
        actorName: users.name,
        actorPersonaName: personaCards.name,
      })
      .from(personaInteractionLogs)
      .leftJoin(users, eq(personaInteractionLogs.actorUserId, users.id))
      .leftJoin(personaCards, eq(personaInteractionLogs.actorUserId, personaCards.userId))
      .where(eq(personaInteractionLogs.personaUserId, parseInt(personaUserId)))
      .orderBy(desc(personaInteractionLogs.createdAt))
      .limit(limit);

    // Parse details JSON and format the response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      interactionType: log.interactionType,
      targetId: log.targetId,
      details: log.details ? JSON.parse(log.details) : null,
      createdAt: log.createdAt,
      actor: {
        userId: log.actorUserId,
        name: log.actorPersonaName || log.actorName,
        userName: log.actorName,
      }
    }));

    return NextResponse.json({
      success: true,
      data: formattedLogs,
      message: `Retrieved ${formattedLogs.length} interaction logs`
    });

  } catch (error) {
    console.error('Error fetching persona interaction logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
