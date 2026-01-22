import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { playgroundConversations, playgroundUtterances, users, presentablePersonas, personaCards, studentSurveyResponses, studentProjects, personalizedPapers } from '@/lib/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
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
    const { userId, content } = body;

    if (!userId || !content || !content.trim()) {
      return NextResponse.json({
        success: false,
        error: 'User ID and message content are required',
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

    // Verify user owns this conversation
    if (conversation.userId !== parseInt(userId)) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 403 });
    }

    // Get user info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Get current utterance count
    const currentCount = conversation.totalUtterances || 0;

    // Save user's message
    const [newUtterance] = await db.insert(playgroundUtterances).values({
      conversationId,
      speakerId: parseInt(userId),
      speakerType: 'user',
      speakerName: user.name,
      content: content.trim(),
      sequenceNumber: currentCount + 1,
    }).returning();

    // Update conversation
    await db
      .update(playgroundConversations)
      .set({
        totalUtterances: currentCount + 1,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(playgroundConversations.id, conversationId));

    // Check for @ mentions
    const participatingAgents = JSON.parse(conversation.participatingAgents);
    console.log('Participating agents:', participatingAgents);
    
    // Extract user IDs - handle both array of numbers and array of objects
    let participatingAgentIds: number[];
    if (participatingAgents.length > 0 && typeof participatingAgents[0] === 'number') {
      // Already an array of numbers
      participatingAgentIds = participatingAgents;
    } else {
      // Array of objects, extract userId
      participatingAgentIds = participatingAgents.map((agent: any) => agent.userId);
    }
    console.log('Participating agent IDs:', participatingAgentIds);
    console.log('User message content:', content);
    
    const mentionedAgents = await detectMentions(content, participatingAgentIds);
    console.log('Mention detection result:', mentionedAgents);
    
    const agentResponses = [];
    if (mentionedAgents.length > 0) {
      // Automatically trigger ALL mentioned agents to speak in sequence
      console.log(`✅ Detected ${mentionedAgents.length} mentioned agent(s):`, mentionedAgents.map(a => a.name).join(', '));
      
      let sequenceOffset = 1; // Start after user's message
      for (const mentionedAgent of mentionedAgents) {
        try {
          console.log(`🤖 Generating response for ${mentionedAgent.name}...`);
          const response = await generateAgentResponse(
            conversationId,
            mentionedAgent.userId,
            mentionedAgent.name,
            conversation,
            currentCount + sequenceOffset,
            true // mentionedDirectly flag
          );
          console.log(`✅ Generated agent response from ${mentionedAgent.name}`);
          agentResponses.push(response);
          sequenceOffset++; // Increment for next agent's sequence number
        } catch (error) {
          console.error(`❌ Error generating agent response for ${mentionedAgent.name}:`, error);
        }
      }
    } else {
      console.log('ℹ️ No mentions detected in message');
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
      agentResponses, // Include ALL agent responses (array)
    });
  } catch (error) {
    console.error('Error sending user message:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send message',
    }, { status: 500 });
  }
}

// Helper function to detect ALL @ mentions in a message
async function detectMentions(content: string, participatingAgentIds: number[]) {
  console.log('🔍 detectMentions called with:', { content, participatingAgentIds });
  
  // Match ALL @FirstName patterns (global flag)
  const mentionMatches = content.matchAll(/@(\w+)/gi);
  const mentionedNames = Array.from(mentionMatches).map(match => match[1].toLowerCase().trim());
  
  console.log('All mention matches found:', mentionedNames);
  
  if (mentionedNames.length === 0) {
    console.log('No @ mention patterns found in content');
    return [];
  }
  
  // Get participating agents from persona cards (primary source for names)
  const participatingAgents = await db
    .select({
      userId: personaCards.userId,
      name: personaCards.name,
    })
    .from(personaCards)
    .where(inArray(personaCards.userId, participatingAgentIds));
  
  console.log('Found participating agents from DB:', participatingAgents);
  
  // Find all matching agents
  const matchedAgents = [];
  const seenUserIds = new Set(); // Prevent duplicates if same person mentioned twice
  
  for (const mentionedName of mentionedNames) {
    for (const agent of participatingAgents) {
      const fullName = agent.name.toLowerCase();
      const firstName = agent.name.split(' ')[0].toLowerCase();
      
      console.log(`Checking agent: ${agent.name} (firstName: ${firstName}, fullName: ${fullName}) against: ${mentionedName}`);
      
      if ((fullName === mentionedName || firstName === mentionedName) && !seenUserIds.has(agent.userId)) {
        console.log('✅ Match found!', agent);
        matchedAgents.push(agent);
        seenUserIds.add(agent.userId);
        break; // Move to next mentioned name
      }
    }
  }
  
  console.log(`✅ Found ${matchedAgents.length} matching agents:`, matchedAgents);
  return matchedAgents;
}

// Helper function to generate agent response (similar to generate-utterance but inline)
async function generateAgentResponse(
  conversationId: number,
  agentUserId: number,
  agentName: string,
  conversation: any,
  currentUtteranceCount: number,
  mentionedDirectly: boolean
) {
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
    console.log('Using default memory structure for mention response');
  }

  // Get agent persona name from persona card (primary source)
  const [agentPersonaCard] = await db
    .select({
      name: personaCards.name,
    })
    .from(personaCards)
    .where(eq(personaCards.userId, agentUserId))
    .limit(1);

  if (!agentPersonaCard || !agentPersonaCard.name || agentPersonaCard.name.trim() === '') {
    throw new Error('Agent persona card not found or has no name');
  }
  
  const resolvedAgentName = agentPersonaCard.name;

  // Get agent's survey responses
  const [agentSurvey] = await db
    .select()
    .from(studentSurveyResponses)
    .where(eq(studentSurveyResponses.userId, agentUserId))
    .limit(1);

  if (!agentSurvey) {
    throw new Error('Agent survey responses not found');
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

  const mentionContext = mentionedDirectly 
    ? '\n\n🔔 YOU WERE DIRECTLY MENTIONED (@-tagged) in the last message. Respond directly to what they said to you.'
    : '';

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

  const personaPrompt = `You are ${resolvedAgentName}, a college student chatting with classmates in a group chat.
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
${last10Messages || 'Conversation just started'}${mentionContext}

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

  console.log('Calling OpenAI for mentioned agent:', agentName);
  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    max_completion_tokens: 2000, // Increased to allow for reasoning tokens + actual response
    messages: [{
      role: 'user',
      content: personaPrompt,
    }],
  });

  const utteranceContent = response.choices[0]?.message?.content?.trim() || '';
  console.log('Generated content length for mention:', utteranceContent.length);
  
  if (!utteranceContent) {
    console.error('Empty utterance generated for mentioned agent:', agentName);
    console.error('OpenAI response:', JSON.stringify(response, null, 2));
    throw new Error('Generated empty utterance for mentioned agent');
  }

  // Save utterance to database
  console.log('Saving mentioned agent utterance with sequence:', currentUtteranceCount + 1);
  const [newUtterance] = await db.insert(playgroundUtterances).values({
    conversationId,
    speakerId: agentUserId,
    speakerType: 'agent',
    speakerName: resolvedAgentName,
    content: utteranceContent,
    sequenceNumber: currentUtteranceCount + 1,
    generationContext: JSON.stringify({
      mentionedDirectly,
      userGoal: conversation.userGoal,
      hierarchicalMemory: memoryStructure,
      last10Messages,
    }),
  }).returning();
  console.log('Mentioned agent utterance saved with id:', newUtterance.id);

  // Update conversation count
  await db
    .update(playgroundConversations)
    .set({
      totalUtterances: currentUtteranceCount + 1,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(playgroundConversations.id, conversationId));

  return {
    id: newUtterance.id,
    speakerId: newUtterance.speakerId,
    speakerType: newUtterance.speakerType,
    speakerName: newUtterance.speakerName,
    content: newUtterance.content,
    timestamp: newUtterance.timestamp,
    sequenceNumber: newUtterance.sequenceNumber,
  };
}

