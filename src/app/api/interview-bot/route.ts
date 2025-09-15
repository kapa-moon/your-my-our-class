import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { interviewChats, studentSurveyResponses } from '@/lib/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

// GET: Retrieve existing interview chat for a user
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

    const existingChat = await db
      .select()
      .from(interviewChats)
      .where(eq(interviewChats.userId, parseInt(userId)))
      .limit(1);

    if (existingChat.length === 0) {
      return NextResponse.json({
        success: true,
        chatExists: false,
        data: null
      });
    }

    const chat = existingChat[0];
    return NextResponse.json({
      success: true,
      chatExists: true,
      data: {
        id: chat.id,
        chatHistory: JSON.parse(chat.chatHistory || '[]'),
        isCompleted: chat.isCompleted,
        totalMessages: chat.totalMessages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching interview chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Send message to interview bot or start new interview
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message, action } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Handle different actions
    if (action === 'start') {
      return await startNewInterview(parseInt(userId));
    } else if (action === 'send') {
      return await handleChatMessage(parseInt(userId), message);
    } else if (action === 'complete') {
      return await completeInterview(parseInt(userId));
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in interview bot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function startNewInterview(userId: number) {
  try {
    // Get user's survey data
    const surveyData = await db
      .select()
      .from(studentSurveyResponses)
      .where(eq(studentSurveyResponses.userId, userId))
      .limit(1);

    if (surveyData.length === 0) {
      return NextResponse.json(
        { error: 'No survey data found. Please complete the survey first.' },
        { status: 404 }
      );
    }

    const survey = surveyData[0];

    // Create system prompt based on survey data
    const systemPrompt = `You are a friendly academic interviewer helping a student elaborate on their survey responses for a Communication and AI course. Your goal is to have a natural conversation that helps them reflect deeper on their academic journey, research interests, and goals.

Survey Data Summary:
- Name: ${survey.preferredName || 'Student'}
- Academic Background: ${survey.academicBackground || 'Not provided'}
- Research Interests: ${survey.researchInterests || 'Not provided'}
- Recent Readings: ${survey.recentReadings || 'Not provided'}
- Class Goals: ${survey.classGoals || 'Not provided'}
- Discussion Style: ${survey.discussionStyle || 'Not provided'}

Guidelines:
1. Ask follow-up questions that encourage elaboration and reflection
2. Be conversational and supportive, not interrogative
3. Focus on one topic at a time before moving to the next
4. Help them articulate their thoughts more clearly
5. Ask about specific examples, experiences, or motivations
6. Keep responses concise (2-3 sentences max)
7. End when they indicate they're ready to finish

Start by greeting them warmly and asking an open-ended follow-up question about one aspect of their survey responses.`;

    const initialMessage = `Hi ${survey.preferredName || 'there'}! 👋 

I'd love to chat a bit more about your survey responses to help you reflect on your academic journey. I noticed you mentioned "${survey.researchInterests?.substring(0, 100)}..." as your research interests. 

What initially drew you to this area? Was there a particular moment, class, or experience that sparked this curiosity?`;

    const chatHistory: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant',
        content: initialMessage,
        timestamp: new Date().toISOString()
      }
    ];

    // Check if interview already exists
    const existingChat = await db
      .select()
      .from(interviewChats)
      .where(eq(interviewChats.userId, userId))
      .limit(1);

    if (existingChat.length > 0) {
      // Update existing chat
      await db
        .update(interviewChats)
        .set({
          chatHistory: JSON.stringify(chatHistory),
          isCompleted: false,
          totalMessages: 1,
          updatedAt: new Date()
        })
        .where(eq(interviewChats.userId, userId));
    } else {
      // Create new chat
      await db.insert(interviewChats).values({
        userId,
        chatHistory: JSON.stringify(chatHistory),
        isCompleted: false,
        totalMessages: 1
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Interview started',
      botResponse: initialMessage
    });

  } catch (error) {
    console.error('Error starting interview:', error);
    return NextResponse.json(
      { error: 'Failed to start interview' },
      { status: 500 }
    );
  }
}

async function handleChatMessage(userId: number, userMessage: string) {
  try {
    // Get existing chat
    const existingChat = await db
      .select()
      .from(interviewChats)
      .where(eq(interviewChats.userId, userId))
      .limit(1);

    if (existingChat.length === 0) {
      return NextResponse.json(
        { error: 'No active interview found. Please start a new interview.' },
        { status: 404 }
      );
    }

    const chat = existingChat[0];
    const chatHistory: ChatMessage[] = JSON.parse(chat.chatHistory || '[]');

    // Add user message to history
    chatHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    });

    // Prepare messages for OpenAI (exclude timestamps)
    const openaiMessages = chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: openaiMessages,
      temperature: 1,
    });

    const botResponse = completion.choices[0]?.message?.content || 'I apologize, I had trouble processing that. Could you try again?';

    // Add bot response to history
    chatHistory.push({
      role: 'assistant',
      content: botResponse,
      timestamp: new Date().toISOString()
    });

    // Update database
    await db
      .update(interviewChats)
      .set({
        chatHistory: JSON.stringify(chatHistory),
        totalMessages: chatHistory.filter(msg => msg.role !== 'system').length,
        updatedAt: new Date()
      })
      .where(eq(interviewChats.userId, userId));

    return NextResponse.json({
      success: true,
      botResponse
    });

  } catch (error) {
    console.error('Error handling chat message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

async function completeInterview(userId: number) {
  try {
    // Get existing chat
    const existingChat = await db
      .select()
      .from(interviewChats)
      .where(eq(interviewChats.userId, userId))
      .limit(1);

    if (existingChat.length === 0) {
      return NextResponse.json(
        { error: 'No active interview found' },
        { status: 404 }
      );
    }

    const chat = existingChat[0];
    const chatHistory: ChatMessage[] = JSON.parse(chat.chatHistory || '[]');

    // Extract persona information using AI
    const extractionPrompt = `Based on the following interview conversation, extract and summarize information for each of these five persona card categories. Be concise but comprehensive:

1. Academic Background
2. Research Interest  
3. Recent Reading/Thoughts
4. Learning Goal for the Class
5. Discussion Style

Chat History:
${chatHistory.filter(msg => msg.role !== 'system').map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}

Respond with ONLY a JSON object in this exact format:
{
  "academicBackground": "extracted information...",
  "researchInterest": "extracted information...",
  "recentReading": "extracted information...",
  "learningGoal": "extracted information...",
  "discussionStyle": "extracted information..."
}`;

    const extractionCompletion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: 'user', content: extractionPrompt }],
      temperature: 1,
    });

    let extractedData;
    try {
      const responseText = extractionCompletion.choices[0]?.message?.content || '';
      extractedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse extraction response:', parseError);
      extractedData = {
        academicBackground: '',
        researchInterest: '',
        recentReading: '',
        learningGoal: '',
        discussionStyle: ''
      };
    }

    // Calculate session duration
    const startTime = new Date(chat.createdAt);
    const endTime = new Date();
    const sessionDuration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // in minutes

    // Update database with completion
    await db
      .update(interviewChats)
      .set({
        isCompleted: true,
        completedAt: new Date(),
        sessionDuration,
        extractedAcademicBackground: extractedData.academicBackground,
        extractedResearchInterest: extractedData.researchInterest,
        extractedRecentReading: extractedData.recentReading,
        extractedLearningGoal: extractedData.learningGoal,
        extractedDiscussionStyle: extractedData.discussionStyle,
        updatedAt: new Date()
      })
      .where(eq(interviewChats.userId, userId));

    return NextResponse.json({
      success: true,
      message: 'Interview completed successfully',
      extractedData,
      sessionDuration
    });

  } catch (error) {
    console.error('Error completing interview:', error);
    return NextResponse.json(
      { error: 'Failed to complete interview' },
      { status: 500 }
    );
  }
}
