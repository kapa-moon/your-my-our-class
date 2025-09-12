import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { studentSurveyResponses } from '@/lib/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, responses } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json(
        { error: 'Survey responses are required' },
        { status: 400 }
      );
    }

    // Extract responses by category
    const surveyData = {
      userId: parseInt(userId),
      
      // 1. Basics
      preferredName: responses.preferredName || null,
      lastName: responses.lastName || null,
      gender: responses.gender || null,
      age: responses.age || null,
      
      // 2. Comprehensive Questions
      academicBackground: responses.academicBackground || null,
      researchInterests: responses.researchInterests || null,
      recentReadings: responses.recentReadings || null,
      classGoals: responses.classGoals || null,
      discussionStyle: responses.discussionStyle || null,
    };

    // Check if user already has survey responses
    const existingResponse = await db
      .select()
      .from(studentSurveyResponses)
      .where(eq(studentSurveyResponses.userId, parseInt(userId)))
      .limit(1);

    let result;
    if (existingResponse.length > 0) {
      // Update existing response
      result = await db
        .update(studentSurveyResponses)
        .set({
          ...surveyData,
          updatedAt: new Date(),
        })
        .where(eq(studentSurveyResponses.userId, parseInt(userId)))
        .returning();
    } else {
      // Insert new response
      result = await db
        .insert(studentSurveyResponses)
        .values(surveyData)
        .returning();
    }

    return NextResponse.json({
      success: true,
      message: 'Survey responses saved successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Error saving survey responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const response = await db
      .select()
      .from(studentSurveyResponses)
      .where(eq(studentSurveyResponses.userId, parseInt(userId)))
      .limit(1);

    if (response.length === 0) {
      return NextResponse.json(
        { success: true, data: null, message: 'No survey responses found' }
      );
    }

    return NextResponse.json({
      success: true,
      data: response[0]
    });

  } catch (error) {
    console.error('Error fetching survey responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
