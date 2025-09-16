import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, personaCards } from '@/lib/schema';

export async function GET(request: NextRequest) {
  try {
    // Fetch all users and their avatar colors
    const usersWithColors = await db
      .select({
        userId: users.id,
        userName: users.name,
        personaName: personaCards.name,
        avatarColor: personaCards.avatarColor,
        isGuest: users.isGuest,
      })
      .from(users)
      .leftJoin(personaCards, eq(users.id, personaCards.userId))
      .where(eq(users.isGuest, false));

    const debug = usersWithColors
      .filter(user => user.personaName) // Only users with persona cards
      .map(user => ({
        userId: user.userId,
        userName: user.userName,
        personaName: user.personaName,
        avatarColor: user.avatarColor,
        hasAvatarColor: !!user.avatarColor,
        avatarColorValue: user.avatarColor || 'NULL'
      }));

    return NextResponse.json({
      success: true,
      data: debug,
      message: `Debug info for ${debug.length} users with persona cards`
    });

  } catch (error) {
    console.error('Error fetching avatar color debug info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug info' },
      { status: 500 }
    );
  }
}
