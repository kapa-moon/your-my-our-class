import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  playgroundConversations, 
  playgroundUtterances,
  presentablePersonas,
  personaCards,
  studentProjects,
  personalizedPapers,
  studentSurveyResponses
} from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const conversationId = parseInt(id);
    const body = await request.json();
    const { agentUserId } = body;

    if (!agentUserId) {
      return NextResponse.json({
        success: false,
        error: 'Agent user ID is required',
      }, { status: 400 });
    }

    // Get conversation
    const [conversation] = await db
      .select()
      .from(playgroundConversations)
      .where(eq(playgroundConversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      return NextResponse.json({
        success: false,
        error: 'Conversation not found',
      }, { status: 404 });
    }

    if (conversation.isEnded) {
      return NextResponse.json({
        success: false,
        error: 'Conversation has ended',
      }, { status: 400 });
    }

    // Get last 10 utterances for short-term context
    const recentUtterances = await db
      .select()
      .from(playgroundUtterances)
      .where(eq(playgroundUtterances.conversationId, conversationId))
      .orderBy(desc(playgroundUtterances.sequenceNumber))
      .limit(10);

    const last10Messages = recentUtterances
      .reverse()
      .map(u => `${u.speakerName}: ${u.content}`)
      .join('\n');
    
    // Parse hierarchical memory
    let memoryStructure: any = { longTerm: [], mediumTerm: '' };
    try {
      if (conversation.memoryPad && conversation.memoryPad.startsWith('{')) {
        memoryStructure = JSON.parse(conversation.memoryPad);
      } else if (conversation.memoryPad) {
        // Old format - treat as medium-term
        memoryStructure = { longTerm: [], mediumTerm: conversation.memoryPad };
      }
    } catch (e) {
      console.log('Using default memory structure');
    }

    // Get agent persona name from persona card (primary source)
    console.log('Generating utterance for agentUserId:', agentUserId);
    const [agentPersonaCard] = await db
      .select({
        name: personaCards.name,
      })
      .from(personaCards)
      .where(eq(personaCards.userId, agentUserId))
      .limit(1);

    if (!agentPersonaCard || !agentPersonaCard.name || agentPersonaCard.name.trim() === '') {
      console.error('Agent persona card not found or has no name for userId:', agentUserId);
      return NextResponse.json({
        success: false,
        error: 'Agent persona card not found',
      }, { status: 404 });
    }
    
    const agentName = agentPersonaCard.name;
    console.log('Found agent persona:', agentName);

    // Get agent's survey responses (the TRUE source of their POV)
    const [agentSurvey] = await db
      .select()
      .from(studentSurveyResponses)
      .where(eq(studentSurveyResponses.userId, agentUserId))
      .limit(1);

    if (!agentSurvey) {
      return NextResponse.json({
        success: false,
        error: 'Agent survey responses not found',
      }, { status: 404 });
    }

    // Get agent's project
    const [agentProject] = await db
      .select()
      .from(studentProjects)
      .where(
        and(
          eq(studentProjects.userId, agentUserId),
          eq(studentProjects.isLatest, true)
        )
      )
      .limit(1);

    // Get agent's personalized papers (top 10 most relevant)
    const agentPapers = await db
      .select()
      .from(personalizedPapers)
      .where(eq(personalizedPapers.userId, agentUserId))
      .orderBy(personalizedPapers.relevanceRanking)
      .limit(10);

    // Build comprehensive context
    const papersContext = agentPapers.map(p => 
      `- ${p.title} (Week ${p.weekNumber}: ${p.weekTopic})\n  ${p.tldr || p.abstract?.substring(0, 200) || 'No summary available'}`
    ).join('\n');

    // Randomly select a style to encourage variety
    const styles = [
      'direct and clear',
      'casual and conversational',
      'questioning and curious',
      'analytical',
      'brief and to-the-point',
      'thoughtful and exploring ideas',
      'building on what others said',
      'pushing back on an idea'
    ];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    
    // Randomly select word count between 4 and 45 words
    const wordCount = Math.floor(Math.random() * 42) + 4; // 4 to 45 words

    // Course knowledge base - key papers the class has been discussing
    const courseKnowledgeBase = `
=== COURSE READING BACKGROUND ===
Your class has been reading and discussing these papers. You can reference ideas from them naturally if relevant:

1. "Role play with large language models" (Shanahan et al.)
   - Casting LLM dialogue behavior in terms of role play
   - Addresses (apparent) deception and (apparent) self-awareness in dialogue agents
   - Describes behavior without anthropomorphism

2. "Evaluating large language models in theory of mind tasks" (Kosinski)
   - Recent LLMs can solve false-belief tasks typically used to evaluate Theory of Mind
   - Signifies more powerful and socially skilled AI
   - Profound positive and negative implications

3. "Using Large Language Models to Simulate Multiple Humans" (Aher et al.)
   - Introduces "Turing Experiment" (TE) for evaluating language models
   - Replicates classic experiments: Ultimatum Game, Garden Path Sentences, Milgram Shock, Wisdom of Crowds
   - Reveals "hyper-accuracy distortion" in some models

4. "Hypothetical Minds: Scaffolding Theory of Mind for Multi-Agent Tasks" (Cross et al.)
   - Theory of Mind module for multi-agent systems
   - Generates hypotheses about other agents' strategies in natural language
   - Evaluates and refines hypotheses through observation

5. "Improving Interpersonal Communication by Simulating Audiences" (Liu et al.)
   - Explore-Generate-Simulate (EGS) framework
   - Uses LLM simulations to improve goal-oriented communication
   - Simulates audience reactions to determine best communication strategies
`;

    const personaPrompt = `You are ${agentName}, a college student chatting with classmates in a group chat.
${courseKnowledgeBase}

=== YOUR IDENTITY ===

ACADEMIC BACKGROUND:
${agentSurvey.academicBackground || 'Not specified'}

RESEARCH INTERESTS:
${agentSurvey.researchInterests || 'Not specified'}

CLASS GOALS:
${agentSurvey.classGoals || 'Not specified'}

${agentProject?.projectDescription ? `YOUR PROJECT:
${agentProject.projectDescription}
` : ''}

=== CONVERSATION CONTEXT ===

${conversation.userGoal ? `Goal: ${conversation.userGoal}` : ''}

${memoryStructure.longTerm && memoryStructure.longTerm.length > 0 ? `
Key points so far:
${memoryStructure.longTerm.map((fact: string, i: number) => `${i + 1}. ${fact}`).join('\n')}
` : ''}

Recent messages:
${last10Messages || 'Conversation just started'}

=== INSTRUCTIONS ===

Write a response of approximately ${wordCount} words as a college student in a casual academic group chat.
Your style for THIS message: ${randomStyle}

GUIDELINES (not rigid rules):
- Aim for around ${wordCount} words (can be a bit more or less, be natural)
- Vary your message length and style - sometimes short, sometimes more developed
- Be conversational and natural - talk like a real person
- Use casual language when it feels right: "yeah," "honestly," "idk," "tbh," "kinda," etc.
- But don't force slang into every message - mix it up
- No emojis
- Reference course readings naturally if relevant to the discussion
- Feel free to build on others' ideas, ask questions, or push back
- Don't repeat the same phrases or patterns every time
- Be yourself - let your personality and interests show

EXAMPLES (showing variety in length and style):
Short (4-10 words): "that makes sense"
Short (4-10 words): "wait what about the edge cases though"
Medium (15-25 words): "honestly i think the privacy issues are way bigger than people realize, especially with how much data these models need"
Medium (15-25 words): "yeah but how would you even validate that without access to the training data"
Longer (30-40 words): "the Kosinski paper was interesting but i'm not totally convinced that passing false belief tasks means the model actually has theory of mind, could just be pattern matching from training data right"
Longer (30-40 words): "i see what you're saying but i think you're underestimating the computational cost here, like even if it works in theory it might not be practical for real applications"

Just respond naturally with your message (no quotes, no extra commentary):`;

    console.log('Calling OpenAI for agent:', agentName);
    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      max_completion_tokens: 2000, // Increased to allow for reasoning tokens + actual response (gpt-5-mini uses reasoning)
      messages: [{
        role: 'user',
        content: personaPrompt,
      }],
    });

    const utteranceContent = response.choices[0]?.message?.content?.trim() || '';
    console.log('Generated content length:', utteranceContent.length);
    
    if (!utteranceContent) {
      console.error('Empty utterance generated for agent:', agentName);
      console.error('OpenAI response:', JSON.stringify(response, null, 2));
      return NextResponse.json({
        success: false,
        error: 'Generated empty utterance',
      }, { status: 500 });
    }

    // Get current utterance count
    const currentCount = conversation.totalUtterances || 0;

    // Save utterance to database
    console.log('Saving utterance to database with sequence:', currentCount + 1);
    const [newUtterance] = await db.insert(playgroundUtterances).values({
      conversationId,
      speakerId: agentUserId,
      speakerType: 'agent',
      speakerName: agentName,
      content: utteranceContent,
      sequenceNumber: currentCount + 1,
      generationContext: JSON.stringify({
        userGoal: conversation.userGoal,
        hierarchicalMemory: memoryStructure,
        last10Messages,
        paperCount: agentPapers.length,
      }),
    }).returning();
    console.log('Utterance saved with id:', newUtterance.id);

    // Update conversation
    await db
      .update(playgroundConversations)
      .set({
        totalUtterances: currentCount + 1,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(playgroundConversations.id, conversationId));

    // Update memory pad and mindmap every 3 utterances (starting from 3rd utterance)
    if (currentCount >= 3 && currentCount % 3 === 0) {
      await Promise.all([
        updateMemoryPad(conversationId, conversation.memoryPad || ''),
        updateMindmap(conversationId, conversation.conversationMindmap || '')
      ]);
    }

    return NextResponse.json({
      success: true,
      utterance: {
        id: newUtterance.id,
        speakerId: newUtterance.speakerId,
        speakerType: newUtterance.speakerType,
        speakerName: newUtterance.speakerName,
        content: newUtterance.content,
        timestamp: newUtterance.timestamp,
        sequenceNumber: newUtterance.sequenceNumber,
      },
    });
  } catch (error) {
    console.error('Error generating utterance:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate utterance',
    }, { status: 500 });
  }
}

// Helper function to update memory pad with hierarchical memory
async function updateMemoryPad(conversationId: number, currentMemoryPad: string) {
  try {
    console.log('📝 Updating memory pad for conversation:', conversationId);
    
    // Get all utterances
    const allUtterances = await db
      .select()
      .from(playgroundUtterances)
      .where(eq(playgroundUtterances.conversationId, conversationId))
      .orderBy(playgroundUtterances.sequenceNumber);

    // Parse existing memory pad (if it exists and is JSON)
    let existingMemory: any = { longTerm: [], mediumTerm: '' };
    try {
      if (currentMemoryPad && currentMemoryPad.startsWith('{')) {
        existingMemory = JSON.parse(currentMemoryPad);
      }
    } catch (e) {
      // If parsing fails, treat as old format (plain text)
      existingMemory = { longTerm: [], mediumTerm: currentMemoryPad || '' };
    }

    // Process all conversation messages for memory update
    // No need to exclude recent messages - we want the full context
    if (allUtterances.length === 0) {
      console.log('ℹ️ No messages to process for memory update');
      return;
    }

    const conversationText = allUtterances
      .map(u => `${u.speakerName}: ${u.content}`)
      .join('\n');

    const hierarchicalPrompt = `You are maintaining a hierarchical memory system for an ongoing academic discussion. Update the memory based on the conversation.

=== EXISTING MEMORY ===

LONG-TERM (Key Facts - persistent across entire conversation):
${existingMemory.longTerm && existingMemory.longTerm.length > 0 ? existingMemory.longTerm.join('\n') : 'None yet'}

MEDIUM-TERM (Recent Summary):
${existingMemory.mediumTerm || 'None yet'}

=== FULL CONVERSATION ===
${conversationText}

=== YOUR TASK ===

Generate a JSON object with updated hierarchical memory:

{
  "longTerm": [
    // Array of strings: Key facts, decisions, important insights that should persist
    // Update/refine existing facts + add any NEW critical information
    // Limit to 8-10 most important facts total
  ],
  "mediumTerm": "A 2-3 sentence summary of recent discussion themes and progress"
}

Guidelines:
- LONG-TERM: Capture factual, important information (decisions made, key insights, main topics, conclusions)
- MEDIUM-TERM: Focus on flow, recent themes, what direction the conversation is going
- Be concise but informative
- Preserve important facts from existing long-term memory
- Only add to long-term if something is truly important/factual

Respond with ONLY the JSON object, no other text:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      max_completion_tokens: 2000, // Increased to handle reasoning + response
      messages: [{
        role: 'user',
        content: hierarchicalPrompt,
      }],
    });

    const responseText = response.choices[0]?.message?.content?.trim() || '';
    
    if (!responseText) {
      console.error('❌ Empty response from memory pad update');
      return;
    }

    // Parse the JSON response
    let newMemory;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        newMemory = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse memory pad JSON:', parseError);
      console.error('Response was:', responseText);
      // Fall back to existing memory
      newMemory = existingMemory;
    }

    // Store as JSON string
    const newMemoryPad = JSON.stringify(newMemory);
    console.log('✅ Updated memory pad:', newMemory);

    // Update memory pad in database
    await db
      .update(playgroundConversations)
      .set({
        memoryPad: newMemoryPad,
        updatedAt: new Date(),
      })
      .where(eq(playgroundConversations.id, conversationId));
  } catch (error) {
    console.error('❌ Error updating memory pad:', error);
  }
}

// Helper function to update mindmap - tree structure of conversation topics (max 3 levels)
async function updateMindmap(conversationId: number, currentMindmap: string) {
  try {
    console.log('Updating mindmap for conversation:', conversationId);
    
    // Get all utterances
    const allUtterances = await db
      .select()
      .from(playgroundUtterances)
      .where(eq(playgroundUtterances.conversationId, conversationId))
      .orderBy(playgroundUtterances.sequenceNumber);

    // Parse existing mindmap (if it exists and is JSON)
    let existingMindmap: any = { root: 'Conversation', children: [] };
    try {
      if (currentMindmap && currentMindmap.startsWith('{')) {
        existingMindmap = JSON.parse(currentMindmap);
      }
    } catch (e) {
      // If parsing fails, start fresh
      existingMindmap = { root: 'Conversation', children: [] };
    }

    // Process all conversation messages for mindmap update
    if (allUtterances.length === 0) {
      console.log('ℹ️ No messages to process for mindmap update');
      return;
    }

    const conversationText = allUtterances
      .map(u => `${u.speakerName}: ${u.content}`)
      .join('\n');

    const mindmapPrompt = `You are creating a hierarchical mindmap (tree structure) to track high-level ideas in an ongoing academic discussion. The mindmap has a maximum of 3 levels of depth.

=== EXISTING MINDMAP ===
${JSON.stringify(existingMindmap, null, 2)}

=== FULL CONVERSATION ===
${conversationText}

=== YOUR TASK ===

Generate an UPDATED mindmap as a JSON tree structure with these constraints:
1. Maximum 3 levels of depth (root → level 1 → level 2)
2. Each node represents a high-level topic or theme discussed
3. Keep it concise - aim for 2-5 children per node
4. Each node should have: "topic" (string) and optionally "children" (array)
5. Update/refine the existing structure rather than replacing it entirely
6. Add new branches for new topics
7. Combine or restructure if the conversation has evolved

Example structure:
{
  "root": "Project Discussion",
  "children": [
    {
      "topic": "AI Ethics",
      "children": [
        {"topic": "Bias in algorithms"},
        {"topic": "Privacy concerns"}
      ]
    },
    {
      "topic": "Implementation Ideas",
      "children": [
        {"topic": "Technical approach"},
        {"topic": "User testing"}
      ]
    }
  ]
}

Guidelines:
- Focus on TOPICS and THEMES, not individual messages
- Be specific but concise (3-8 words per topic)
- Organize logically (group related ideas)
- Keep the total number of nodes under 15
- Don't include meta-discussion (e.g., "greetings", "introductions")

Respond with ONLY the JSON object, no other text:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      max_completion_tokens: 2000,
      messages: [{
        role: 'user',
        content: mindmapPrompt,
      }],
      response_format: { type: 'json_object' },
    });

    const responseText = response.choices[0]?.message?.content?.trim() || '';
    
    if (!responseText) {
      console.error('❌ Empty response from mindmap update');
      return;
    }

    // Parse the JSON response
    let newMindmap;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        newMindmap = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse mindmap JSON:', parseError);
      console.error('Response was:', responseText);
      // Fall back to existing mindmap
      newMindmap = existingMindmap;
    }

    // Store as JSON string
    const newMindmapString = JSON.stringify(newMindmap);
    console.log('✅ Updated mindmap:', newMindmap);

    // Update mindmap in database
    await db
      .update(playgroundConversations)
      .set({
        conversationMindmap: newMindmapString,
        updatedAt: new Date(),
      })
      .where(eq(playgroundConversations.id, conversationId));
  } catch (error) {
    console.error('❌ Error updating mindmap:', error);
  }
}

