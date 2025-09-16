import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, personaCards, squareCardPositions, presentablePersonas } from '@/lib/schema';

export async function GET(request: NextRequest) {
  try {
    // Fetch all non-guest users with their persona cards, presentable personas, and square positions
    const usersWithPersonas = await db
      .select({
        userId: users.id,
        userName: users.name,
        // Persona card data (main content and sub-bullets)
        personaName: personaCards.name,
        academicBackground: personaCards.academicBackground,
        researchInterest: personaCards.researchInterest,
        recentReading: personaCards.recentReading,
        learningGoal: personaCards.learningGoal,
        avatarColor: personaCards.avatarColor,
        introMessage: personaCards.introMessage,
        // Sub-bullet data
        academicBackgroundSubBullets: personaCards.academicBackgroundSubBullets,
        researchInterestSubBullets: personaCards.researchInterestSubBullets,
        recentReadingSubBullets: personaCards.recentReadingSubBullets,
        learningGoalSubBullets: personaCards.learningGoalSubBullets,
        // Presentable persona data (for affiliation)
        affiliation: presentablePersonas.affiliation,
        // Square position data (not used anymore but kept for compatibility)
        xPosition: squareCardPositions.xPosition,
        yPosition: squareCardPositions.yPosition,
        rotation: squareCardPositions.rotation,
        zIndex: squareCardPositions.zIndex,
      })
      .from(users)
      .leftJoin(personaCards, eq(users.id, personaCards.userId))
      .leftJoin(presentablePersonas, eq(users.id, presentablePersonas.userId))
      .leftJoin(squareCardPositions, eq(users.id, squareCardPositions.userId))
      .where(eq(users.isGuest, false));

    // Filter out users without persona cards and organize the data
    // Also remove duplicates by using a Map with userId as key
    const userMap = new Map();
    
    usersWithPersonas
      .filter(user => user.personaName) // Only users with persona cards
      .forEach(user => {
        // Only keep the first occurrence of each user
        if (!userMap.has(user.userId)) {
          // Parse sub-bullets JSON strings
          const parseSubBullets = (jsonString: string | null) => {
            if (!jsonString) return [];
            try {
              return JSON.parse(jsonString);
            } catch (e) {
              console.error('Error parsing sub-bullets:', e);
              return [];
            }
          };

          userMap.set(user.userId, {
            userId: user.userId,
            userName: user.userName,
            persona: {
              name: user.personaName || user.userName,
              affiliation: user.affiliation || 'Student',
              academicBackground: user.academicBackground,
              researchInterest: user.researchInterest,
              recentReading: user.recentReading,
              learningGoal: user.learningGoal,
              avatarColor: user.avatarColor || '#262D59',
              introMessage: user.introMessage,
              // Sub-bullets for the "show more" section
              academicBackgroundSubBullets: parseSubBullets(user.academicBackgroundSubBullets),
              researchInterestSubBullets: parseSubBullets(user.researchInterestSubBullets),
              recentReadingSubBullets: parseSubBullets(user.recentReadingSubBullets),
              learningGoalSubBullets: parseSubBullets(user.learningGoalSubBullets),
            },
            position: {
              x: user.xPosition,
              y: user.yPosition,
              rotation: user.rotation || 0,
              zIndex: user.zIndex || 0,
            }
          });
        }
      });

    const squareData = Array.from(userMap.values());

    return NextResponse.json({
      success: true,
      data: squareData,
      message: `Found ${squareData.length} users in The Square`,
      gridHeight: calculateGridHeight(squareData.length)
    });

  } catch (error) {
    console.error('Error fetching Square data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Square data' },
      { status: 500 }
    );
  }
}

// POST: Initialize or update card positions for users without positions
export async function POST(request: NextRequest) {
  try {
    // Get all users with persona cards but no square positions
    const usersNeedingPositions = await db
      .select({
        userId: users.id,
        userName: users.name,
        hasPersona: personaCards.id,
        hasPosition: squareCardPositions.id,
      })
      .from(users)
      .leftJoin(personaCards, eq(users.id, personaCards.userId))
      .leftJoin(squareCardPositions, eq(users.id, squareCardPositions.userId))
      .where(eq(users.isGuest, false));

    const usersToPosition = usersNeedingPositions.filter(user => 
      user.hasPersona && !user.hasPosition // Only users with persona cards but without positions
    );

    if (usersToPosition.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All users already have positions in The Square'
      });
    }

    // Generate grid positions for new users
    const positions = generateGridPositions(usersToPosition.length);
    
    const positionsToInsert = usersToPosition.map((user, index) => ({
      userId: user.userId,
      xPosition: Math.round(positions[index].x),
      yPosition: Math.round(positions[index].y),
      rotation: 0,
      zIndex: 0,
    }));

    await db.insert(squareCardPositions).values(positionsToInsert);

    return NextResponse.json({
      success: true,
      message: `Initialized positions for ${positionsToInsert.length} users`,
      positions: positionsToInsert
    });

  } catch (error) {
    console.error('Error initializing Square positions:', error);
    return NextResponse.json(
      { error: 'Failed to initialize Square positions' },
      { status: 500 }
    );
  }
}

// Helper function to generate grid positions
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

// Calculate the total height needed for the grid
function calculateGridHeight(userCount: number) {
  const containerWidth = 1400;
  const cardWidth = 364; // Card width (1.3 times of 280px)
  const cardHeight = 240;
  const paddingX = 40;
  const paddingY = 40;
  const marginLeft = 40;
  const marginTop = 40;
  
  const availableWidth = containerWidth - marginLeft - 40;
  const cols = Math.floor((availableWidth + paddingX) / (cardWidth + paddingX));
  const rows = Math.ceil(userCount / cols);
  
  return marginTop + rows * (cardHeight + paddingY) + 40; // Extra bottom margin
}
