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

    const systemPrompt = `You are an expert at creating concise, engaging academic persona summaries for university students. Your task is to create a presentable persona card that helps classmates get to know each other.

Guidelines:
- Be concise but informative - each bullet point should be 1-2 sentences or one long sentence
- Use bullet points (max 3 per section)
- Use **bold** and *italics* appropriately for emphasis
- ENSURE ALL FIELDS HAVE CONTENT - never leave any section empty
- Left column content should be focused and practical
- Right column content should be engaging and personal
- Extract the most relevant information from available data
- If information is limited, create plausible content based on context
- Make it relatable and interesting for classmates

IMPORTANT: Every field must have meaningful content. If source data is sparse, extrapolate thoughtfully based on academic context.

Respond with ONLY a JSON object in this exact format:
{
  "header": {
    "name": "First name only",
    "affiliation": "Academic status, program, department, or lab affiliation (e.g., PhD Student in Communication, MS in HCI, Research Assistant)"
  },
  "leftColumn": {
    "background": "• Previous education and relevant experience that shapes their academic perspective.\\n• Key skills, methodological approaches, or technical capabilities they bring to academic work.\\n• Notable coursework, projects, or experiences that inform their current interests.",
    "discussionStyle": "• Communication preferences and approach to academic discussions.\\n• Collaboration style and how they contribute to group work.\\n• Learning preferences and how they engage with new ideas."
  },
  "rightColumn": {
    "guidingQuestion": "• Current research question, intellectual curiosity, or problem they're passionate about exploring.\\n• What drives their academic work and the key questions they're investigating.\\n• Theoretical frameworks or methodological approaches they're interested in applying.",
    "learningGoals": "• Specific things they want to learn in this class and why these areas interest them.\\n• Skills, knowledge, or perspectives they hope to develop through the course.\\n• How this class connects to their broader academic or career goals.",
    "recentInterests": "• Recent readings, experiences, or ideas that have influenced their thinking.\\n• Current intellectual fascinations or emerging research interests they're exploring.\\n• New directions or evolving perspectives in their academic work."
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

    // Store or update the presentable persona in the database
    const personaToStore = {
      userId: parseInt(userId),
      name: aiResponse.header.name,
      affiliation: aiResponse.header.affiliation,
      background: aiResponse.leftColumn.background,
      discussionStyle: aiResponse.leftColumn.discussionStyle,
      guidingQuestion: aiResponse.rightColumn.guidingQuestion,
      learningGoals: aiResponse.rightColumn.learningGoals,
      recentInterests: aiResponse.rightColumn.recentInterests,
      updatedAt: new Date()
    };

    // Check if record exists to decide between insert or update
    const existingPersona = await db
      .select()
      .from(presentablePersonas)
      .where(eq(presentablePersonas.userId, parseInt(userId)))
      .limit(1);

    if (existingPersona.length > 0) {
      // Update existing record
      await db
        .update(presentablePersonas)
        .set(personaToStore)
        .where(eq(presentablePersonas.userId, parseInt(userId)));
    } else {
      // Insert new record
      await db.insert(presentablePersonas).values(personaToStore);
    }

    return NextResponse.json({
      success: true,
      data: aiResponse
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
