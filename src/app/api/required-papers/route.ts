import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { requiredPapers } from '../../../lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get('week');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db.select().from(requiredPapers).limit(limit).offset(offset);
    
    if (weekNumber) {
      query = query.where(eq(requiredPapers.weekNumber, weekNumber)) as any;
    }

    const papers = await query;
    const totalCount = await db.select().from(requiredPapers);

    return NextResponse.json({
      success: true,
      papers,
      count: papers.length,
      total: totalCount.length,
      limit,
      offset,
      ...(weekNumber && { weekNumber })
    });

  } catch (error) {
    console.error('Error fetching required papers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch required papers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
