# Persona Playground AI Conversation Architecture

## Overview

The Persona Playground is an AI-powered group chat system where students can have dynamic conversations with persona agents representing their classmates. The system features intelligent moderation, context-aware utterance generation, and a queue-based speaker management system.

## Architecture Components

### 1. Database Schema

#### `playground_conversations` Table
Stores conversation metadata and state.

**Key Fields:**
- `id`: Unique conversation identifier
- `userId`: User who initiated the conversation
- `conversationType`: 'dm' or 'group'
- `userGoal`: User's stated goal for the conversation (optional)
- `participatingAgents`: JSON array of persona user IDs (e.g., `[1, 5, 8, 12]`)
- `memoryPad`: AI-generated summary of key conversation points (updated periodically)
- `moderationRule`: JSON object with moderation settings
- `speakerQueue`: JSON array of `{userId, reasoning}` objects
- `isEnded`: Boolean state indicating if conversation has ended
- `totalUtterances`: Count of messages
- `lastActivityAt`: Timestamp of last activity

#### `playground_utterances` Table
Stores individual messages with metadata.

**Key Fields:**
- `id`: Unique utterance identifier
- `conversationId`: Foreign key to conversation
- `speakerId`: User ID (null for system messages)
- `speakerType`: 'user', 'agent', 'moderator', or 'system'
- `speakerName`: Display name of speaker
- `content`: Message content
- `generationContext`: JSON object with context used for generation (for agent utterances)
- `sequenceNumber`: Order in conversation
- `timestamp`: When message was created

### 2. API Endpoints

#### POST `/api/persona-playground/conversation/create`
**Purpose:** Initialize a new conversation

**Request Body:**
```json
{
  "userId": 7,
  "conversationType": "group",
  "userGoal": "Discuss my project idea",
  "participatingAgents": [1, 5, 8, 12]
}
```

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": 123,
    "userId": 7,
    "conversationType": "group",
    "userGoal": "Discuss my project idea",
    "participatingAgents": [1, 5, 8, 12],
    "speakerQueue": [],
    "isEnded": false
  }
}
```

#### GET `/api/persona-playground/conversation/[id]`
**Purpose:** Fetch conversation state and all utterances

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": 123,
    "userId": 7,
    "conversationType": "group",
    "userGoal": "Discuss my project idea",
    "participatingAgents": [1, 5, 8, 12],
    "memoryPad": "Summary of key points...",
    "speakerQueue": [
      {"userId": 5, "reasoning": "Has relevant project experience"},
      {"userId": 8, "reasoning": "Can provide feedback on methodology"}
    ],
    "isEnded": false,
    "totalUtterances": 15
  },
  "utterances": [
    {
      "id": 1,
      "speakerId": 5,
      "speakerType": "agent",
      "speakerName": "Alex Chen",
      "content": "That's an interesting approach!",
      "timestamp": "2025-10-13T10:30:00Z",
      "sequenceNumber": 1
    }
  ]
}
```

#### POST `/api/persona-playground/conversation/[id]/moderate`
**Purpose:** Moderator AI decides who should speak next

**How it works:**
1. Fetches recent conversation history (last 5 utterances)
2. Gets participating agents' personas, projects, and papers
3. Uses OpenAI gpt-5-mini to analyze conversation and select 2-3 most relevant speakers
4. Returns queue with reasoning for each selection

**Response:**
```json
{
  "success": true,
  "speakerQueue": [
    {"userId": 5, "reasoning": "Has relevant ML background for this discussion"},
    {"userId": 12, "reasoning": "Recently read papers on similar topics"}
  ]
}
```

**Moderator AI Prompt Context:**
- Conversation history
- Each agent's full persona (background, interests, discussion style, etc.)
- Agent projects
- User's conversation goal
- Current memory pad summary
- Who has spoken recently

#### POST `/api/persona-playground/conversation/[id]/generate-utterance`
**Purpose:** Generate a contextual utterance from a specific agent

**Request Body:**
```json
{
  "agentUserId": 5
}
```

**Context Used for Generation:**
1. **User's conversation goal** - What the user wants to achieve
2. **Agent persona** - Full persona card information
3. **Agent's project** - Current project type and description
4. **Agent's paper bank** - Top 10 personalized papers (title, TLDR, week topic)
5. **Memory pad** - Summary of key points discussed so far
6. **Last 3 utterances** - Immediate conversation context

**Agent Persona Prompt Structure:**
```
You are [Name], a student in a class discussion...

YOUR PERSONA:
- Background, interests, discussion style, etc.

YOUR PROJECT:
- Type and description

YOUR READING LIST:
- Papers you're familiar with

CONVERSATION GOAL:
- What the user wants to discuss

MEMORY PAD:
- Key points so far

LAST 3 MESSAGES:
- Immediate context

Generate a natural, conversational response (1-3 sentences)
```

**Response:**
```json
{
  "success": true,
  "utterance": {
    "id": 42,
    "speakerId": 5,
    "speakerType": "agent",
    "speakerName": "Alex Chen",
    "content": "I actually explored something similar in my empirical project. Have you considered using mixed methods?",
    "timestamp": "2025-10-13T10:35:00Z",
    "sequenceNumber": 16
  }
}
```

#### POST `/api/persona-playground/conversation/[id]/send-message`
**Purpose:** User sends a message (jumps into conversation)

**Request Body:**
```json
{
  "userId": 7,
  "content": "What do you all think about using surveys?"
}
```

**Response:**
```json
{
  "success": true,
  "utterance": {
    "id": 43,
    "speakerId": 7,
    "speakerType": "user",
    "speakerName": "You",
    "content": "What do you all think about using surveys?",
    "timestamp": "2025-10-13T10:36:00Z",
    "sequenceNumber": 17
  }
}
```

### 3. Frontend Architecture

#### State Management

**Key State Variables:**
- `conversationId`: Current conversation ID
- `speakerQueue`: Array of next speakers with reasoning
- `utterances`: Array of all messages
- `selectedAgents`: Array of participating agents
- `isGenerating`: Loading state for utterance generation
- `isModerating`: Loading state for moderation
- `memoryPad`: Conversation summary

#### User Flow

1. **Entry Screen**
   - Option 1: AI Organize (automatic matching)
   - Option 2: Manual selection

2. **Manual Selection**
   - Browse classmates
   - Select up to 4
   - Choose DM or Group Chat

3. **Chat Screen**
   - Messages area (scrollable)
   - Speaker queue (sidebar)
   - Three action buttons

#### Three User Actions

**1. Click a Speaker in Queue**
```typescript
const generateUtteranceFromAgent = async (agentUserId: number) => {
  // Call generate-utterance API
  // Add utterance to conversation
  // Remove speaker from queue
}
```

**2. Next Round (Re-moderate)**
```typescript
const handleNextRound = async () => {
  // Clear current queue
  // Call moderate API
  // Get new speakers
}
```

**3. Jump In (Send Message)**
```typescript
const handleSendMessage = async () => {
  // Send user message
  // Clear queue
  // Trigger automatic re-moderation
}
```

### 4. Memory Pad System

The memory pad is automatically updated every 5 utterances to maintain a concise summary of the conversation.

**Update Trigger:**
```typescript
if (currentCount > 5 && currentCount % 5 === 0) {
  await updateMemoryPad(conversationId, conversation.memoryPad || '');
}
```

**Memory Pad Prompt:**
```
Summarize the key points, topics, and insights from this conversation
in 3-5 bullet points. Keep it concise and focus on the most important
themes and conclusions.

Previous summary: [...]
New conversation text: [...]
```

## Data Flow Example

### Scenario: Group Chat About Project Ideas

1. **User starts conversation**
   ```
   POST /conversation/create
   → Creates conversation #123
   → participatingAgents: [5, 8, 12]
   ```

2. **Initial moderation**
   ```
   POST /conversation/123/moderate
   → Moderator AI analyzes empty conversation
   → Returns: [Alex (5), Maya (8)] as initial speakers
   ```

3. **User clicks on Alex in queue**
   ```
   POST /conversation/123/generate-utterance {agentUserId: 5}
   → Fetches Alex's persona, project, papers
   → Generates: "Hey! I'd love to hear about your project idea."
   → Removes Alex from queue
   ```

4. **User clicks on Maya**
   ```
   POST /conversation/123/generate-utterance {agentUserId: 8}
   → Generates: "Same here! I'm working on something related to social media analysis."
   → Queue now empty
   ```

5. **User sends message**
   ```
   POST /conversation/123/send-message
   → Adds user's message
   → Automatically triggers moderation
   → New queue: [Jordan (12), Alex (5)]
   ```

6. **Repeat...**

## Key Design Decisions

### Why Speaker Queue?
- Gives user control over conversation flow
- Makes AI decision-making transparent (shows reasoning)
- Prevents overwhelming the user with rapid-fire responses
- Allows for more thoughtful, deliberate conversations

### Why Memory Pad?
- Prevents context window overflow for long conversations
- Maintains conversation coherence
- Enables agents to reference earlier discussion points
- Reduces API costs by summarizing instead of sending full history

### Why Moderator AI?
- Ensures diverse participation
- Contextually relevant speakers
- Avoids same agent dominating
- Creates natural conversation flow

### Why Context-Rich Utterance Generation?
- Makes agents feel authentic and consistent
- Enables agents to reference their actual work and readings
- Grounds conversation in course material
- Creates educational value beyond simple chatbot responses

## Future Enhancements

### Potential Features
1. **Conversation branching** - Fork conversations at interesting points
2. **Multi-turn agent responses** - Allow agents to have back-and-forth
3. **Real-time reactions** - Emoji reactions to messages
4. **Save/export** - Export conversations for later reference
5. **Replay mode** - Review past conversations with annotations
6. **Analytics** - Track which agents contribute most, topic evolution
7. **Suggested topics** - AI suggests discussion topics based on readings
8. **Voice mode** - Text-to-speech for agent utterances

### Scalability Considerations
1. **Pagination** - Load utterances in chunks for long conversations
2. **Caching** - Cache persona/paper data to reduce DB queries
3. **Rate limiting** - Prevent abuse of AI generation
4. **Background jobs** - Move memory pad updates to background workers
5. **WebSocket** - Real-time updates for collaborative features

## Testing Guide

### Manual Testing Checklist

1. **Create Conversation**
   - [ ] AI organize with goal
   - [ ] AI organize without goal
   - [ ] Manual select DM
   - [ ] Manual select group chat

2. **Speaker Queue**
   - [ ] Initial moderation populates queue
   - [ ] Clicking speaker generates utterance
   - [ ] Speaker is removed from queue after speaking
   - [ ] Next round clears and repopulates queue

3. **User Actions**
   - [ ] User can send message
   - [ ] Sending message triggers moderation
   - [ ] All three actions work simultaneously

4. **Context Quality**
   - [ ] Agents reference their projects
   - [ ] Agents reference their papers
   - [ ] Responses stay relevant to conversation
   - [ ] Memory pad gets updated

5. **Edge Cases**
   - [ ] Empty queue behavior
   - [ ] Queue with one speaker
   - [ ] Very long conversations (50+ utterances)
   - [ ] Network errors gracefully handled

## Troubleshooting

### Common Issues

**Issue:** Speaker queue not populating
- Check moderator API logs
- Verify agents have complete persona data
- Check OPENAI_API_KEY is valid

**Issue:** Agent utterances seem generic
- Verify agent has project data
- Check personalized papers are loaded
- Review generation context in database

**Issue:** Memory pad not updating
- Check utterance count (should update every 5)
- Verify OpenAI API quota
- Check database permissions

**Issue:** Conversation feels repetitive
- Moderator may be selecting same agents
- Consider adjusting moderation rules
- Add more diverse agents to pool

## API Key Requirements

Required environment variables in `.env.local`:
```
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
```

## Performance Metrics

- Average moderation time: ~2-3 seconds
- Average utterance generation: ~3-5 seconds
- Memory pad update: ~2-4 seconds
- Database queries per utterance: ~5-7

## Conclusion

This architecture creates a rich, context-aware conversational experience that leverages student personas, projects, and course materials to facilitate meaningful peer interactions. The speaker queue mechanism gives users control while the AI handles the complexity of managing natural conversation flow.

