import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { personaCards, studentSurveyResponses, interviewChats, presentablePersonas } from '@/lib/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GET: Retrieve existing presentable persona
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

    const existingPersona = await db
      .select()
      .from(presentablePersonas)
      .where(eq(presentablePersonas.userId, parseInt(userId)))
      .limit(1);

    if (existingPersona.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No presentable persona found'
      });
    }

    const persona = existingPersona[0];
    return NextResponse.json({
      success: true,
      data: {
        header: {
          name: persona.name,
          affiliation: persona.affiliation || ''
        },
        leftColumn: {
          background: persona.background || '',
          discussionStyle: persona.discussionStyle || ''
        },
        rightColumn: {
          guidingQuestion: persona.guidingQuestion || '',
          learningGoals: persona.learningGoals || '',
          recentInterests: persona.recentInterests || ''
        }
      }
    });

  } catch (error) {
    console.error('Error fetching presentable persona:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, forceRegenerate = false } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if presentable persona already exists
    if (!forceRegenerate) {
      const existingPersona = await db
        .select()
        .from(presentablePersonas)
        .where(eq(presentablePersonas.userId, parseInt(userId)))
        .limit(1);

      if (existingPersona.length > 0) {
        const persona = existingPersona[0];
        return NextResponse.json({
          success: true,
          data: {
            header: {
              name: persona.name,
              affiliation: persona.affiliation || ''
            },
            leftColumn: {
              background: persona.background || '',
              discussionStyle: persona.discussionStyle || ''
            },
            rightColumn: {
              guidingQuestion: persona.guidingQuestion || '',
              learningGoals: persona.learningGoals || '',
              recentInterests: persona.recentInterests || ''
            }
          }
        });
      }
    }

    // Fetch all persona-related data for generation
    const [personaData, surveyData, interviewData] = await Promise.all([
      db.select().from(personaCards).where(eq(personaCards.userId, parseInt(userId))).limit(1),
      db.select().from(studentSurveyResponses).where(eq(studentSurveyResponses.userId, parseInt(userId))).limit(1),
      db.select().from(interviewChats).where(eq(interviewChats.userId, parseInt(userId))).limit(1)
    ]);

    if (personaData.length === 0) {
      return NextResponse.json(
        { error: 'No persona card found. Please complete your persona first.' },
        { status: 404 }
      );
    }

    const persona = personaData[0];
    const survey = surveyData[0] || null;
    const interview = interviewData[0] || null;

    // Compile all available content
    const allContent = {
      name: persona.name || survey?.preferredName || 'Student',
      academicBackground: [
        persona.academicBackground,
        survey?.academicBackground,
        interview?.extractedAcademicBackground
      ].filter(Boolean).join('\n\n'),
      researchInterest: [
        persona.researchInterest,
        survey?.researchInterests,
        interview?.extractedResearchInterest
      ].filter(Boolean).join('\n\n'),
      recentReading: [
        persona.recentReading,
        survey?.recentReadings,
        interview?.extractedRecentReading
      ].filter(Boolean).join('\n\n'),
      learningGoal: [
        persona.learningGoal,
        survey?.classGoals,
        interview?.extractedLearningGoal
      ].filter(Boolean).join('\n\n'),
      discussionStyle: [
        persona.discussionStyle,
        survey?.discussionStyle,
        interview?.extractedDiscussionStyle
      ].filter(Boolean).join('\n\n'),
      demographics: {
        gender: survey?.gender,
        age: survey?.age,
        lastName: survey?.lastName
      }
    };

    const systemPrompt = `You are an expert at creating concise, engaging academic persona summaries for university students. Your task is to process raw survey/interview data and create a polished persona card.

Guidelines:
- Extract and summarize the most important information from the raw data
- Main bullet points should be 1 sentence or very short 2 sentences maximum
- Sub-bullet points should be exactly 3 items, each being 1 short sentence
- Be highly concise and to the point
- Extract actual content from the provided data, don't make things up
- If data is sparse, work with what's available but don't fabricate

Respond with ONLY a JSON object in this exact format:
{
  "personaCard": {
    "name": "First name from the data",
    "academicBackground": "One concise sentence summarizing their academic background",
    "researchInterest": "One concise sentence summarizing their research interests", 
    "recentReading": "One concise sentence summarizing their recent thoughts/readings",
    "learningGoal": "One concise sentence summarizing what they want to learn in this class",
    "introMessage": "A warm, friendly 2-3 sentence self-introduction that captures their personality, tone, and enthusiasm as if they're introducing themselves to classmates. Mirror their original conversational style from the survey responses."
  },
  "subBullets": {
    "academicBackground": [
      "Short sentence about their education/program",
      "Short sentence about relevant experience or skills", 
      "Short sentence about their academic focus or specialization"
    ],
    "researchInterest": [
      "Short sentence about their main research area",
      "Short sentence about specific methods or approaches they're interested in",
      "Short sentence about future research directions they want to explore"
    ],
    "recentReading": [
      "Short sentence about a recent paper/book that influenced them",
      "Short sentence about a key insight or learning they gained",
      "Short sentence about how this connects to their current thinking"
    ],
    "learningGoal": [
      "Short sentence about specific skills they want to develop",
      "Short sentence about knowledge areas they want to explore",
      "Short sentence about how this class fits their broader goals"
    ]
  }
}`;

    const userPrompt = `Student Information:
Name: ${allContent.name}

Academic Background:
${allContent.academicBackground || 'Not provided'}

Research Interests:
${allContent.researchInterest || 'Not provided'}

Recent Reading/Thoughts:
${allContent.recentReading || 'Not provided'}

Learning Goals:
${allContent.learningGoal || 'Not provided'}

Discussion Style:
${allContent.discussionStyle || 'Not provided'}

Demographics: ${JSON.stringify(allContent.demographics)}

Please create a concise, engaging persona summary that will help classmates get to know this student.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 1,
    });

    let aiResponse;
    try {
      const responseText = completion.choices[0]?.message?.content || '';
      aiResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to process AI summary' },
        { status: 500 }
      );
    }

    // Update the main persona card with summarized content and sub-bullets
    const personaCardUpdate = {
      name: aiResponse.personaCard.name,
      academicBackground: aiResponse.personaCard.academicBackground,
      researchInterest: aiResponse.personaCard.researchInterest,
      recentReading: aiResponse.personaCard.recentReading,
      learningGoal: aiResponse.personaCard.learningGoal,
      introMessage: aiResponse.personaCard.introMessage,
      academicBackgroundSubBullets: JSON.stringify(
        aiResponse.subBullets.academicBackground.map((content: string, index: number) => ({
          id: `academicBackground-sub-${index}`,
          content,
          isChecked: false,
          isConfirmed: false
        }))
      ),
      researchInterestSubBullets: JSON.stringify(
        aiResponse.subBullets.researchInterest.map((content: string, index: number) => ({
          id: `researchInterest-sub-${index}`,
          content,
          isChecked: false,
          isConfirmed: false
        }))
      ),
      recentReadingSubBullets: JSON.stringify(
        aiResponse.subBullets.recentReading.map((content: string, index: number) => ({
          id: `recentReading-sub-${index}`,
          content,
          isChecked: false,
          isConfirmed: false
        }))
      ),
      learningGoalSubBullets: JSON.stringify(
        aiResponse.subBullets.learningGoal.map((content: string, index: number) => ({
          id: `learningGoal-sub-${index}`,
          content,
          isChecked: false,
          isConfirmed: false
        }))
      ),
      updatedAt: new Date()
    };

    // Update the main persona card
    await db
      .update(personaCards)
      .set(personaCardUpdate)
      .where(eq(personaCards.userId, parseInt(userId)));

    // Also create/update the presentable persona for the old view compatibility
    const presentablePersonaData = {
      userId: parseInt(userId),
      name: aiResponse.personaCard.name,
      affiliation: allContent.demographics?.lastName ? 
        `Student in ${survey?.academicBackground?.split(' ').slice(0, 3).join(' ') || 'Academic Program'}` : 
        'Student', // Generate basic affiliation from academic background
      background: aiResponse.personaCard.academicBackground,
      discussionStyle: persona.discussionStyle || 'Open to various discussion styles',
      guidingQuestion: aiResponse.personaCard.researchInterest,
      learningGoals: aiResponse.personaCard.learningGoal,
      recentInterests: aiResponse.personaCard.recentReading,
      updatedAt: new Date()
    };

    const existingPresentablePersona = await db
      .select()
      .from(presentablePersonas)
      .where(eq(presentablePersonas.userId, parseInt(userId)))
      .limit(1);

    if (existingPresentablePersona.length > 0) {
      await db
        .update(presentablePersonas)
        .set(presentablePersonaData)
        .where(eq(presentablePersonas.userId, parseInt(userId)));
    } else {
      await db.insert(presentablePersonas).values(presentablePersonaData);
    }

    return NextResponse.json({
      success: true,
      data: {
        personaCard: aiResponse.personaCard,
        subBullets: aiResponse.subBullets
      }
    });

  } catch (error) {
    console.error('Error generating persona summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update existing presentable persona
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, field, value } = body;

    if (!userId || !field || value === undefined) {
      return NextResponse.json(
        { error: 'User ID, field, and value are required' },
        { status: 400 }
      );
    }

    // Map field names to database columns
    const fieldMapping: { [key: string]: string } = {
      'header.name': 'name',
      'header.affiliation': 'affiliation',
      'leftColumn.background': 'background',
      'leftColumn.discussionStyle': 'discussionStyle',
      'rightColumn.guidingQuestion': 'guidingQuestion',
      'rightColumn.learningGoals': 'learningGoals',
      'rightColumn.recentInterests': 'recentInterests'
    };

    const dbField = fieldMapping[field];
    if (!dbField) {
      return NextResponse.json(
        { error: 'Invalid field name' },
        { status: 400 }
      );
    }

    const updateData: any = {
      [dbField]: value,
      updatedAt: new Date()
    };

    await db
      .update(presentablePersonas)
      .set(updateData)
      .where(eq(presentablePersonas.userId, parseInt(userId)));

    return NextResponse.json({
      success: true,
      message: 'Presentable persona updated successfully'
    });

  } catch (error) {
    console.error('Error updating presentable persona:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
