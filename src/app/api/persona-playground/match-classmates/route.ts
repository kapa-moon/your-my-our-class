import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  // Parse body once and store for potential reuse in error handler
  const body = await request.json();
  const { userId, userGoal, classmates } = body;
  
  try {

    if (!classmates || classmates.length === 0) {
      return NextResponse.json(
        { error: 'No classmates available' },
        { status: 400 }
      );
    }

    // IMPORTANT: Filter out the current user to prevent self-matching
    const availableClassmates = classmates.filter((c: any) => c.userId !== userId);

    if (availableClassmates.length < 3) {
      return NextResponse.json(
        { error: 'Not enough classmates available for matching' },
        { status: 400 }
      );
    }

    // Build the matching prompt
    const defaultPrompt = "matching 3-4 classmates agents who are a mix of similar and non-similar academic and background information with the user";
    const fullPrompt = userGoal?.trim() 
      ? `${defaultPrompt}. User requirement: ${userGoal.trim()}`
      : defaultPrompt;

    // Format classmates data for AI
    const classmatesInfo = availableClassmates.map((c: any) => ({
      id: c.id,
      name: c.name,
      affiliation: c.affiliation,
      academicBackground: c.academicBackground,
      researchInterest: c.researchInterest,
      learningGoal: c.learningGoal,
      discussionStyle: c.discussionStyle,
      projectType: c.projectType,
    }));

    // Call OpenAI to select appropriate classmates
    const systemPrompt = `You are a helpful assistant that matches students for group conversations based on their academic backgrounds, research interests, and conversation goals.

Your task is to select 3-4 classmates from the provided list that would make for an engaging and productive group discussion. Consider:
1. A mix of similar and complementary academic backgrounds
2. Diverse perspectives and research interests
3. The user's stated goal (if provided)

Return your response as a JSON object with this exact structure:
{
  "selectedIds": [id1, id2, id3],
  "reasoning": "ONE concise sentence (15 words max) explaining why these classmates were selected"
}

Only include the classmate IDs from the provided list. Select 3-4 classmates. Keep reasoning VERY brief.`;

    const userPrompt = `Matching criteria: ${fullPrompt}

Available classmates:
${classmatesInfo.map((c: any, idx: number) => `
${idx + 1}. ID: ${c.id}, Name: ${c.name}
   Affiliation: ${c.affiliation}
   Academic Background: ${c.academicBackground || 'Not specified'}
   Research Interest: ${c.researchInterest || 'Not specified'}
   Learning Goal: ${c.learningGoal || 'Not specified'}
   Discussion Style: ${c.discussionStyle || 'Not specified'}
   Project Type: ${c.projectType || 'Not specified'}
`).join('\n')}

Select 3-4 classmates that would be best for this conversation. Return only valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      // Note: gpt-5-mini only supports temperature: 1 (default)
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('No response from AI');
    }

    const aiResponse = JSON.parse(responseText);
    
    // Validate that selected IDs exist in available classmates list (excluding current user)
    const validIds = aiResponse.selectedIds.filter((id: number) => 
      availableClassmates.some((c: any) => c.id === id)
    );

    // If AI didn't return enough valid IDs, fall back to random selection
    if (validIds.length < 3) {
      console.warn('AI returned insufficient valid IDs, using random selection');
      const numAgents = Math.floor(Math.random() * 2) + 3; // 3 or 4
      const shuffled = [...availableClassmates].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, numAgents);
      
      return NextResponse.json({
        success: true,
        selectedIds: selected.map((c: any) => c.id),
        reasoning: 'Diverse mix of backgrounds selected for engaging discussion.',
        method: 'fallback'
      });
    }

    return NextResponse.json({
      success: true,
      selectedIds: validIds.slice(0, 4), // Max 4
      reasoning: aiResponse.reasoning,
      method: 'ai'
    });

  } catch (error) {
    console.error('Error matching classmates:', error);
    
    // Fallback to random selection on error (reuse body parsed at the start)
    const fallbackClassmates = classmates?.filter((c: any) => c.userId !== userId) || [];
    
    if (fallbackClassmates.length >= 3) {
      const numAgents = Math.floor(Math.random() * 2) + 3; // 3 or 4
      const shuffled = [...fallbackClassmates].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, numAgents);
      
      return NextResponse.json({
        success: true,
        selectedIds: selected.map((c: any) => c.id),
        reasoning: 'Diverse mix of backgrounds selected for engaging discussion.',
        method: 'fallback'
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to match classmates' },
      { status: 500 }
    );
  }
}

