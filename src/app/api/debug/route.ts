import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, studentSurveyResponses, personaCards } from '@/lib/schema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || 'users';

    let data;
    switch (table) {
      case 'users':
        data = await db.select().from(users).limit(10);
        break;
      case 'surveys':
        data = await db.select().from(studentSurveyResponses).limit(10);
        break;
      case 'personas':
        data = await db.select().from(personaCards).limit(10);
        break;
      default:
        return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      table,
      count: data.length,
      data
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
