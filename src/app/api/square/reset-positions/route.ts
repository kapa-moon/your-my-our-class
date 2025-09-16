import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, personaCards, squareCardPositions } from '@/lib/schema';

// Helper function to generate grid positions (same as in main route)
function generateGridPositions(count: number) {
  const positions = [];
  const containerWidth = 1400; // Container width
  const cardWidth = 364; // Card width (1.3 times of 280px)
  const cardHeight = 240; // Card height including margin
  const paddingX = 40; // Horizontal spacing between cards
  const paddingY = 40; // Vertical spacing between cards
  const marginLeft = 40; // Left margin
  const marginTop = 40; // Top margin

  // Calculate how many columns can fit
  // Available width = total width - left margin - right margin (40px)
  const availableWidth = containerWidth - marginLeft - 40;
  // Each card takes cardWidth + paddingX, except the last one doesn't need paddingX
  // So: cols * cardWidth + (cols-1) * paddingX <= availableWidth
  // Simplified: cols * (cardWidth + paddingX) - paddingX <= availableWidth
  const cols = Math.floor((availableWidth + paddingX) / (cardWidth + paddingX));
  
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    const position = {
      x: marginLeft + col * (cardWidth + paddingX),
      y: marginTop + row * (cardHeight + paddingY),
      rotation: 0,
    };
    
    positions.push(position);
  }
  
  return positions;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Resetting all square positions to grid layout...');

    // Get all users with persona cards
    const usersWithPersonas = await db
      .select({
        userId: users.id,
        userName: users.name,
        personaName: personaCards.name,
      })
      .from(users)
      .leftJoin(personaCards, eq(users.id, personaCards.userId))
      .where(eq(users.isGuest, false));

    const validUsers = usersWithPersonas.filter(user => user.personaName);

    if (validUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with persona cards found'
      });
    }

    // Delete all existing positions
    await db.delete(squareCardPositions);

    // Generate new grid positions
    const positions = generateGridPositions(validUsers.length);
    
    const positionsToInsert = validUsers.map((user, index) => ({
      userId: user.userId,
      xPosition: Math.round(positions[index].x),
      yPosition: Math.round(positions[index].y),
      rotation: 0,
      zIndex: 0,
    }));

    // Insert new grid positions
    const insertedPositions = await db
      .insert(squareCardPositions)
      .values(positionsToInsert)
      .returning();

    console.log(`✅ Successfully reset positions for ${insertedPositions.length} users`);

    return NextResponse.json({
      success: true,
      message: `Reset positions for ${insertedPositions.length} users to grid layout`,
      positions: insertedPositions.length
    });

  } catch (error) {
    console.error('Error resetting square positions:', error);
    return NextResponse.json(
      { error: 'Failed to reset square positions' },
      { status: 500 }
    );
  }
}
