import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { personalizedPapers, papers, personaCards, studentSurveyResponses } from '@/lib/schema';
import { getCourseContextForWeek, extractRelevantStudentInterests } from '@/lib/course-info';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GET: Retrieve personalized papers for a user and week
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const weekNumber = searchParams.get('week');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let query = db
      .select()
      .from(personalizedPapers)
      .where(eq(personalizedPapers.userId, parseInt(userId)));

    if (weekNumber) {
      query = query.where(and(
        eq(personalizedPapers.userId, parseInt(userId)),
        eq(personalizedPapers.weekNumber, weekNumber)
      )) as any;
    }

    const userPersonalizedPapers = await query.orderBy(personalizedPapers.relevanceRanking);

    return NextResponse.json({
      success: true,
      papers: userPersonalizedPapers,
      count: userPersonalizedPapers.length
    });

  } catch (error) {
    console.error('Error fetching personalized papers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Generate personalized papers for a user using AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, weekNumber, forceRegenerate = false } = body;
    
    console.log('POST request received:', { userId, weekNumber, forceRegenerate });

    if (!userId || !weekNumber) {
      return NextResponse.json(
        { error: 'User ID and week number are required' },
        { status: 400 }
      );
    }

    // Check if personalized papers already exist for this user and week
    if (!forceRegenerate) {
      console.log('Checking for existing papers...');
      try {
        const existingPapers = await db
          .select()
          .from(personalizedPapers)
          .where(and(
            eq(personalizedPapers.userId, parseInt(userId)),
            eq(personalizedPapers.weekNumber, weekNumber)
          ));
        
        console.log('Existing papers found:', existingPapers.length);

        if (existingPapers.length > 0) {
          return NextResponse.json({
            success: true,
            message: 'Personalized papers already exist for this week',
            papers: existingPapers.sort((a, b) => a.relevanceRanking - b.relevanceRanking)
          });
        }
      } catch (dbError) {
        console.error('Database error checking existing papers:', dbError);
        // Continue with generation if there's an error checking existing papers
      }
    }

    // Fetch user's persona and survey data
    const [personaData, surveyData] = await Promise.all([
      db.select().from(personaCards).where(eq(personaCards.userId, parseInt(userId))).limit(1),
      db.select().from(studentSurveyResponses).where(eq(studentSurveyResponses.userId, parseInt(userId))).limit(1)
    ]);

    if (personaData.length === 0 && surveyData.length === 0) {
      return NextResponse.json(
        { error: 'No user profile data found. Please complete your persona card first.' },
        { status: 404 }
      );
    }

    // Get all papers from the paper pool
    const allPapers = await db.select().from(papers);

    if (allPapers.length === 0) {
      return NextResponse.json(
        { error: 'No papers available in the paper pool' },
        { status: 404 }
      );
    }

    // Prepare data for AI matching
    const persona = personaData[0] || null;
    const survey = surveyData[0] || null;
    const courseContext = getCourseContextForWeek(weekNumber);
    const studentInterests = extractRelevantStudentInterests(persona, survey);

    // Create paper summaries for AI analysis
    const paperSummaries = allPapers.map(paper => ({
      id: paper.id,
      paperID: paper.paperID,
      title: paper.title,
      authors: paper.authors,
      abstract: paper.abstract?.substring(0, 500) + '...' || 'No abstract available',
      tldr: paper.tldr || '',
      topics: paper.topics || '',
      category: paper.category
    }));

    // AI prompt for paper matching
    const systemPrompt = `You are an expert academic advisor specializing in communication, psychology, and AI research. Your task is to recommend the most relevant papers from a collection for a specific student based on their interests and the course context.

${courseContext}

Student Profile:
${studentInterests}

Instructions:
1. Analyze each paper against the student's research interests, academic background, and learning goals
2. Consider the weekly topic and how each paper relates to it
3. Prioritize papers that align with both the student's interests AND the course objectives
4. Select exactly 3 papers and rank them 1-3 (1 being most relevant)
5. For each selected paper, provide a brief explanation of why it matches the student's interests

Respond with ONLY a JSON array in this exact format:
[
  {
    "paperID": "paper_semantic_scholar_id",
    "relevanceRanking": 1,
    "matchingReason": "Brief explanation of why this paper is relevant to the student"
  }
]

Be precise and only return the JSON array.`;

    const userPrompt = `Papers available:
${JSON.stringify(paperSummaries, null, 2)}

Please select and rank the top 3 most relevant papers for this student for week ${weekNumber}.`;

    // Make OpenAI API call
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 1, // Higher temperature for more creative results
    });

    let aiResponse;
    try {
      const responseText = completion.choices[0]?.message?.content || '';
      aiResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to process AI recommendations' },
        { status: 500 }
      );
    }

    // Validate AI response
    if (!Array.isArray(aiResponse) || aiResponse.length !== 3) {
      return NextResponse.json(
        { error: 'Invalid AI response format - expected exactly 3 papers' },
        { status: 500 }
      );
    }

    // Always clear existing personalized papers for this user and week to ensure exactly 3 papers
    console.log('Clearing any existing papers for user', userId, 'week', weekNumber);
    await db.delete(personalizedPapers).where(and(
      eq(personalizedPapers.userId, parseInt(userId)),
      eq(personalizedPapers.weekNumber, weekNumber)
    ));

    // Save personalized papers to database
    const personalizedPaperEntries = [];
    
    for (const recommendation of aiResponse) {
      const originalPaper = allPapers.find(p => p.paperID === recommendation.paperID);
      if (!originalPaper) {
        console.warn(`Paper not found: ${recommendation.paperID}`);
        continue;
      }

      // Get the week topic from course info
      const weekInfo = getCourseContextForWeek(weekNumber);
      const weekTopic = weekInfo.match(/Topic: (.+)/)?.[1] || 'Unknown Topic';

      const personalizedEntry = {
        userId: parseInt(userId),
        paperID: originalPaper.paperID,
        title: originalPaper.title,
        authors: originalPaper.authors,
        abstract: originalPaper.abstract,
        tldr: originalPaper.tldr,
        topics: originalPaper.topics,
        embeddings: originalPaper.embeddings,
        doi: originalPaper.doi,
        openAccessPdf: originalPaper.openAccessPdf,
        category: originalPaper.category,
        url: originalPaper.url,
        weekNumber: weekNumber,
        weekTopic: weekTopic,
        relevanceRanking: recommendation.relevanceRanking,
        matchingReason: recommendation.matchingReason,
        keywords: originalPaper.keywords,
      };

      personalizedPaperEntries.push(personalizedEntry);
    }

    // Insert into database
    if (personalizedPaperEntries.length > 0) {
      await db.insert(personalizedPapers).values(personalizedPaperEntries);
      console.log(`Successfully inserted ${personalizedPaperEntries.length} personalized papers for user ${userId}, week ${weekNumber}`);
    }

    // Verify we have exactly 3 papers
    if (personalizedPaperEntries.length !== 3) {
      console.warn(`Warning: Generated ${personalizedPaperEntries.length} papers instead of 3 for user ${userId}, week ${weekNumber}`);
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${personalizedPaperEntries.length} personalized papers for week ${weekNumber}`,
      papers: personalizedPaperEntries.sort((a, b) => a.relevanceRanking - b.relevanceRanking)
    });

  } catch (error) {
    console.error('Error generating personalized papers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
