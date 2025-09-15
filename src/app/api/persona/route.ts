import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { personaCards, studentSurveyResponses, interviewChats } from '@/lib/schema';

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

    // Fetch persona card, survey data, and interview data
    const [existingPersona, surveyResponse, interviewData] = await Promise.all([
      db.select().from(personaCards).where(eq(personaCards.userId, parseInt(userId))).limit(1),
      db.select().from(studentSurveyResponses).where(eq(studentSurveyResponses.userId, parseInt(userId))).limit(1),
      db.select().from(interviewChats).where(eq(interviewChats.userId, parseInt(userId))).limit(1)
    ]);

    if (existingPersona.length > 0) {
      // Include additional data sources
      const personaData = existingPersona[0];
      const survey = surveyResponse[0] || null;
      const interview = interviewData[0] || null;

      return NextResponse.json({
        success: true,
        data: {
          ...personaData,
          surveyData: survey ? {
            academicBackground: survey.academicBackground,
            researchInterests: survey.researchInterests,
            recentReadings: survey.recentReadings,
            classGoals: survey.classGoals,
            discussionStyle: survey.discussionStyle
          } : null,
          interviewData: interview && interview.isCompleted ? {
            academicBackground: interview.extractedAcademicBackground,
            researchInterest: interview.extractedResearchInterest,
            recentReading: interview.extractedRecentReading,
            learningGoal: interview.extractedLearningGoal,
            discussionStyle: interview.extractedDiscussionStyle
          } : null
        }
      });
    }

    // If no persona card exists, create one from survey responses
    if (surveyResponse.length === 0) {
      return NextResponse.json(
        { error: 'No survey responses found. Please complete the survey first.' },
        { status: 404 }
      );
    }

    const survey = surveyResponse[0];
    const interview = interviewData[0] || null;
    
    // Create initial persona card from survey data
    const initialPersona = {
      userId: parseInt(userId),
      name: survey.preferredName || 'Student',
      academicBackground: survey.academicBackground || '',
      researchInterest: survey.researchInterests || '',
      recentReading: survey.recentReadings || '',
      learningGoal: survey.classGoals || '',
      discussionStyle: survey.discussionStyle || '',
    };

    const newPersona = await db
      .insert(personaCards)
      .values(initialPersona)
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        ...newPersona[0],
        surveyData: {
          academicBackground: survey.academicBackground,
          researchInterests: survey.researchInterests,
          recentReadings: survey.recentReadings,
          classGoals: survey.classGoals,
          discussionStyle: survey.discussionStyle
        },
        interviewData: interview && interview.isCompleted ? {
          academicBackground: interview.extractedAcademicBackground,
          researchInterest: interview.extractedResearchInterest,
          recentReading: interview.extractedRecentReading,
          learningGoal: interview.extractedLearningGoal,
          discussionStyle: interview.extractedDiscussionStyle
        } : null
      },
      message: 'Persona card created from survey responses'
    });

  } catch (error) {
    console.error('Error fetching persona card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, personaData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!personaData || typeof personaData !== 'object') {
      return NextResponse.json(
        { error: 'Persona data is required' },
        { status: 400 }
      );
    }

    // Update persona card
    const updatedPersona = await db
      .update(personaCards)
      .set({
        name: personaData.name || null,
        academicBackground: personaData.academicBackground || null,
        researchInterest: personaData.researchInterest || null,
        recentReading: personaData.recentReading || null,
        learningGoal: personaData.learningGoal || null,
        discussionStyle: personaData.discussionStyle || null,
        updatedAt: new Date(),
      })
      .where(eq(personaCards.userId, parseInt(userId)))
      .returning();

    if (updatedPersona.length === 0) {
      return NextResponse.json(
        { error: 'Persona card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPersona[0],
      message: 'Persona card updated successfully'
    });

  } catch (error) {
    console.error('Error updating persona card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
