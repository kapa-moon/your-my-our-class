import { db } from '@/lib/db';
import { users, personaCards, squareCardPositions } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// Helper function to generate scattered positions
function generateScatteredPositions(count: number) {
  const positions = [];
  const containerWidth = 1200; // Container width
  const containerHeight = 800; // Container height
  const cardWidth = 280; // Card width
  const cardHeight = 200; // Card height
  const padding = 50; // Minimum distance between cards

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let position;
    
    do {
      position = {
        x: Math.random() * (containerWidth - cardWidth - 2 * padding) + padding,
        y: Math.random() * (containerHeight - cardHeight - 2 * padding) + padding,
        rotation: Math.round(Math.random() * 10 - 5), // Random rotation between -5 and 5 degrees
      };
      attempts++;
    } while (attempts < 50 && isOverlapping(position, positions, cardWidth, cardHeight, padding));
    
    positions.push(position);
  }
  
  return positions;
}

// Helper function to check if positions overlap
function isOverlapping(newPos: any, existingPositions: any[], width: number, height: number, padding: number) {
  return existingPositions.some(pos => {
    const distX = Math.abs(newPos.x - pos.x);
    const distY = Math.abs(newPos.y - pos.y);
    return distX < (width + padding) && distY < (height + padding);
  });
}

export async function seedSquarePositions() {
  try {
    console.log('🎯 Starting to seed square positions...');
    
    // Get all users with persona cards but no square positions
    const usersNeedingPositions = await db
      .select({
        userId: users.id,
        userName: users.name,
        hasPosition: squareCardPositions.id,
        hasPersona: personaCards.id,
      })
      .from(users)
      .leftJoin(personaCards, eq(users.id, personaCards.userId))
      .leftJoin(squareCardPositions, eq(users.id, squareCardPositions.userId))
      .where(eq(users.isGuest, false));

    const usersToPosition = usersNeedingPositions.filter(user => 
      user.hasPersona && !user.hasPosition // Has persona but no position
    );

    if (usersToPosition.length === 0) {
      console.log('✅ All users with persona cards already have positions in The Square');
      return;
    }

    console.log(`📍 Found ${usersToPosition.length} users needing positions`);
    
    // Generate scattered positions
    const positions = generateScatteredPositions(usersToPosition.length);
    
    const positionsToInsert = usersToPosition.map((user, index) => ({
      userId: user.userId,
      xPosition: Math.round(positions[index].x),
      yPosition: Math.round(positions[index].y),
      rotation: positions[index].rotation,
      zIndex: 0,
    }));

    // Insert positions
    const insertedPositions = await db
      .insert(squareCardPositions)
      .values(positionsToInsert)
      .returning();

    console.log(`✅ Successfully created ${insertedPositions.length} square positions`);
    console.log('📋 Position details:');
    
    insertedPositions.forEach((position, index) => {
      const user = usersToPosition[index];
      console.log(`   ${user.userName} (ID: ${position.userId}) - Position: (${position.xPosition}, ${position.yPosition}) - Rotation: ${position.rotation}°`);
    });
    
    return insertedPositions;
  } catch (error) {
    console.error('❌ Error seeding square positions:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  seedSquarePositions()
    .then(() => {
      console.log('🎉 Square positions seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Square positions seeding failed:', error);
      process.exit(1);
    });
}
