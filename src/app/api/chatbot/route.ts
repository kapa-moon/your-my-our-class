import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { personaCards, studentSurveyResponses } from '@/lib/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch user's persona card and survey data
    const personaData = await db
      .select()
      .from(personaCards)
      .where(eq(personaCards.userId, parseInt(userId)))
      .limit(1);

    const surveyData = await db
      .select()
      .from(studentSurveyResponses)
      .where(eq(studentSurveyResponses.userId, parseInt(userId)))
      .limit(1);

    if (personaData.length === 0 && surveyData.length === 0) {
      return NextResponse.json(
        { error: 'No persona or survey data found. Please complete your profile first.' },
        { status: 404 }
      );
    }

    // Prepare the persona context
    const persona = personaData[0];
    const survey = surveyData[0];
    
    let personaContext = '';
    if (persona) {
      personaContext = `
Student Profile:
- Name: ${persona.name || 'Not specified'}
- Academic Background: ${persona.academicBackground || 'Not specified'}
- Research Interests: ${persona.researchInterest || 'Not specified'}
- Recent Reading/Thoughts: ${persona.recentReading || 'Not specified'}
- Learning Goals: ${persona.learningGoal || 'Not specified'}
- Discussion Style: ${persona.discussionStyle || 'Not specified'}
`;
    }
    
    if (survey) {
      personaContext += `
Additional Survey Data:
- Preferred Name: ${survey.preferredName || 'Not specified'}
- Academic Background: ${survey.academicBackground || 'Not specified'}
- Research Interests: ${survey.researchInterests || 'Not specified'}
- Recent Readings: ${survey.recentReadings || 'Not specified'}
- Class Goals: ${survey.classGoals || 'Not specified'}
- Discussion Style: ${survey.discussionStyle || 'Not specified'}
`;
    }

    // Create the system prompt
    const systemPrompt = `You are a helpful academic assistant for COMM 324: Language and Technology, a course about Large Language Models and AI communication. 

You have access to this student's profile and interests:
${personaContext}

Your role is to:
1. Answer questions about what this student likes based on their profile
2. Help them understand how course topics relate to their interests
3. Suggest connections between their research interests and course materials
4. Be conversational and encouraging
5. Keep responses concise but informative (2-3 sentences usually)

The course covers topics like:
- AI-Mediated Communication
- LLMs and role play
- Social Bots
- Models interacting with each other
- Deception and Truth in AI
- LLMs reflecting human diversity
- LLMs as content analysts
- AI and human cognition

Please respond in a friendly, academic tone that shows you understand their specific interests and background.`;

    // Make the OpenAI API call
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using the latest efficient model
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    return NextResponse.json({
      success: true,
      message: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in chatbot API:', error);
    
    // Handle OpenAI specific errors
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API configuration error. Please check your API key.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
