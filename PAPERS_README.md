# Paper Pool Knowledge Base System

This system manages a collection of academic papers that professors want students to consider. It provides database storage, seeding functionality, and API endpoints for querying papers by topics, keywords, and other criteria.

## Database Schema

The `papers` table includes:
- `id`: Primary key
- `title`: Paper title (required)
- `authors`: Authors (comma-separated)
- `abstract`: Paper abstract
- `url`: Link to the paper
- `keywords`: Comma-separated keywords
- `professorIntent`: Why the professor included this paper
- `topics`: Comma-separated topics/themes
- `professorName`: Professor who suggested the paper
- `createdAt`/`updatedAt`: Timestamps

## Setup and Usage

### 1. Database Migration

Generate and apply the migration:
```bash
npm run db:generate
npm run db:migrate
```

### 2. Seed the Database

Option A - Via command line:
```bash
npm run db:seed
```

Option B - Via API endpoint:
```bash
curl -X POST http://localhost:3000/api/papers/seed
```

### 3. Query Papers via API

#### Get all papers:
```bash
curl "http://localhost:3000/api/papers"
```

#### Search by keyword:
```bash
curl "http://localhost:3000/api/papers?keyword=AI"
```

#### Search by topic:
```bash
curl "http://localhost:3000/api/papers?topic=psychology"
```

#### Search by professor:
```bash
curl "http://localhost:3000/api/papers?professor=Jeff"
```

#### General search (searches across multiple fields):
```bash
curl "http://localhost:3000/api/papers?search=empathy"
```

#### Advanced search with multiple filters:
```bash
curl "http://localhost:3000/api/papers?action=advanced&search=AI&topics=psychology,communication&professors=Jeff&limit=10"
```

#### Get metadata:
```bash
# Get all unique topics
curl "http://localhost:3000/api/papers?action=topics"

# Get all unique keywords
curl "http://localhost:3000/api/papers?action=keywords"

# Get all professor names
curl "http://localhost:3000/api/papers?action=professors"
```

#### Get specific paper by ID:
```bash
curl "http://localhost:3000/api/papers/1"
```

#### Pagination:
```bash
curl "http://localhost:3000/api/papers?limit=10&offset=20"
```

## Available Functions

### Query Functions (`src/lib/papers-queries.ts`)

- `searchPapers(options)` - Search with multiple criteria
- `getPapersByProfessor(professorName)` - Get all papers by a professor
- `getPapersByTopic(topic)` - Get papers by topic/theme
- `getPapersByKeyword(keyword)` - Get papers by keyword
- `getAllTopics()` - Get all unique topics
- `getAllKeywords()` - Get all unique keywords
- `getAllProfessors()` - Get all professor names
- `getPaperById(id)` - Get specific paper
- `getAllPapers(limit, offset)` - Get all papers with pagination
- `advancedSearch(filters)` - Advanced multi-filter search

### API Endpoints

- `GET /api/papers` - Main search endpoint
- `GET /api/papers/[id]` - Get specific paper
- `POST /api/papers/seed` - Seed database with papers

## Current Paper Collection

The system includes 21 papers covering topics such as:
- AI and democracy
- Human-AI interaction
- Empathy and communication
- Personality psychology
- Cognitive biases
- Persuasion and influence
- Social psychology
- AI ethics and fairness

Papers are attributed to professors including Jeff, Kosinski, Maurice, Sander van der linden, and Matthew Flannery.

## Example Usage in Code

```typescript
import { searchPapers, getPapersByTopic } from '@/lib/papers-queries';

// Search for papers about AI
const aiPapers = await searchPapers({ keyword: 'AI', limit: 10 });

// Get all papers on psychology topics
const psychPapers = await getPapersByTopic('psychology');

// Advanced search
const results = await advancedSearch({
  searchTerm: 'empathy',
  topics: ['psychology', 'communication'],
  professors: ['Jeff'],
  limit: 5
});
```

## Database Management

Use Drizzle Studio to explore the database:
```bash
npm run db:studio
```

This will open a web interface to browse and manage your papers data.
