// Import database conditionally to avoid connection errors in dry-run mode
let db: any;
let papers: any;

async function initDatabase() {
  if (!db) {
    const { db: dbInstance } = await import('../lib/db');
    const { papers: papersSchema } = await import('../lib/schema');
    db = dbInstance;
    papers = papersSchema;
  }
  return { db, papers };
}

interface SemanticScholarAuthor {
  authorId: string;
  name: string;
}

interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract: string;
  year: number;
  authors: SemanticScholarAuthor[];
  citationCount: number;
  openAccessPdf?: {
    url: string;
    status: string;
  };
  url: string;
  tldr?: {
    model: string;
    text: string;
  };
  fieldsOfStudy?: string[];
  externalIds?: {
    DOI?: string;
    ArXiv?: string;
    MAG?: string;
    PubMed?: string;
  };
}

interface PaperBankEntry {
  paperID: string;
  title: string;
  authors: string;
  abstract: string;
  tldr: string;
  topics: string;
  embeddings?: number[];
  doi?: string;
  openAccessPdf?: string;
  category: string;
}

class PaperBankBuilder {
  private apiKey?: string;
  private baseUrl = 'https://api.semanticscholar.org/graph/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch paper data from Semantic Scholar API
   */
  async fetchPaperData(paperId: string): Promise<SemanticScholarPaper | null> {
    try {
      const fields = [
        'paperId',
        'title',
        'abstract',
        'year',
        'authors',
        'citationCount',
        'openAccessPdf',
        'url',
        'tldr',
        'fieldsOfStudy',
        'externalIds'
      ].join(',');

      const url = `${this.baseUrl}/paper/${paperId}?fields=${fields}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.log(`Rate limited for paper ${paperId}, waiting 1 second...`);
          await this.delay(1000);
          return this.fetchPaperData(paperId); // Retry
        }
        console.error(`Failed to fetch paper ${paperId}: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching paper ${paperId}:`, error);
      return null;
    }
  }

  /**
   * Search for papers by title or other criteria
   */
  async searchPapers(query: string, limit = 10): Promise<SemanticScholarPaper[]> {
    try {
      const fields = [
        'paperId',
        'title',
        'abstract',
        'year',
        'authors',
        'citationCount',
        'openAccessPdf',
        'url',
        'tldr',
        'fieldsOfStudy',
        'externalIds'
      ].join(',');

      const url = `${this.baseUrl}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.log(`Rate limited for search "${query}", waiting 1 second...`);
          await this.delay(1000);
          return this.searchPapers(query, limit); // Retry
        }
        console.error(`Failed to search papers for "${query}": ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error(`Error searching papers for "${query}":`, error);
      return [];
    }
  }

  /**
   * Generate embeddings for text (placeholder - you can integrate with OpenAI or other embedding services)
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    // Placeholder implementation
    // You would integrate with OpenAI's embedding API or another service here
    console.log('Generating embeddings for text length:', text.length);
    
    // For now, return a mock embedding vector
    return new Array(1536).fill(0).map(() => Math.random());
  }

  /**
   * Transform Semantic Scholar data to our schema
   */
  transformToPaperBankEntry(
    paper: SemanticScholarPaper, 
    category: string,
    embeddings?: number[]
  ): PaperBankEntry {
    return {
      paperID: paper.paperId,
      title: paper.title || '',
      authors: paper.authors?.map(author => author.name).join(', ') || '',
      abstract: paper.abstract || '',
      tldr: paper.tldr?.text || '',
      topics: paper.fieldsOfStudy?.join(', ') || '',
      embeddings,
      doi: paper.externalIds?.DOI,
      openAccessPdf: paper.openAccessPdf?.url,
      category
    };
  }

  /**
   * Process a list of paper identifiers and build the database
   */
  async buildPaperBank(
    paperList: Array<{
      identifier: string; // Can be paperId, DOI, or title
      category: string;
      identifierType?: 'paperId' | 'doi' | 'title';
    }>,
    generateEmbeddings = false
  ): Promise<PaperBankEntry[]> {
    const results: PaperBankEntry[] = [];
    
    console.log(`Processing ${paperList.length} papers...`);

    for (let i = 0; i < paperList.length; i++) {
      const { identifier, category, identifierType = 'title' } = paperList[i];
      
      console.log(`Processing ${i + 1}/${paperList.length}: ${identifier}`);

      let paper: SemanticScholarPaper | null = null;

      if (identifierType === 'paperId' || identifierType === 'doi') {
        paper = await this.fetchPaperData(identifier);
      } else {
        // Search by title
        const searchResults = await this.searchPapers(identifier, 1);
        if (searchResults.length > 0) {
          paper = searchResults[0];
        }
      }

      if (!paper) {
        console.warn(`Could not find paper: ${identifier}`);
        continue;
      }

      let embeddings: number[] | undefined;
      if (generateEmbeddings) {
        const textForEmbedding = `${paper.title} ${paper.abstract}`.substring(0, 8000);
        embeddings = await this.generateEmbeddings(textForEmbedding);
      }

      const entry = this.transformToPaperBankEntry(paper, category, embeddings);
      results.push(entry);

      // Add delay to respect rate limits
      await this.delay(100);
    }

    return results;
  }

  /**
   * Save papers to database
   */
  async savePapersToDatabase(paperEntries: PaperBankEntry[]): Promise<void> {
    console.log(`Saving ${paperEntries.length} papers to database...`);

    const { db, papers } = await initDatabase();

    for (const entry of paperEntries) {
      try {
        await db.insert(papers).values({
          paperID: entry.paperID,
          title: entry.title,
          authors: entry.authors,
          abstract: entry.abstract,
          tldr: entry.tldr,
          topics: entry.topics,
          embeddings: entry.embeddings ? JSON.stringify(entry.embeddings) : null,
          doi: entry.doi,
          openAccessPdf: entry.openAccessPdf,
          category: entry.category,
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoUpdate({
          target: papers.paperID,
          set: {
            title: entry.title,
            authors: entry.authors,
            abstract: entry.abstract,
            tldr: entry.tldr,
            topics: entry.topics,
            embeddings: entry.embeddings ? JSON.stringify(entry.embeddings) : null,
            doi: entry.doi,
            openAccessPdf: entry.openAccessPdf,
            category: entry.category,
            updatedAt: new Date()
          }
        });

        console.log(`✓ Saved: ${entry.title}`);
      } catch (error) {
        console.error(`Failed to save paper ${entry.paperID}:`, error);
      }
    }
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Example usage function
export async function buildPaperBankFromList(
  paperList: Array<{
    identifier: string;
    category: string;
    identifierType?: 'paperId' | 'doi' | 'title';
  }>,
  options: {
    generateEmbeddings?: boolean;
    apiKey?: string;
  } = {}
) {
  const builder = new PaperBankBuilder(options.apiKey);
  
  try {
    const paperEntries = await builder.buildPaperBank(
      paperList,
      options.generateEmbeddings || false
    );
    
    await builder.savePapersToDatabase(paperEntries);
    
    console.log(`✅ Successfully processed ${paperEntries.length} papers`);
    return paperEntries;
  } catch (error) {
    console.error('Error building paper bank:', error);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const paperList = [
    {
      identifier: "AI-Mediated Communication: Definition, Research Agenda, and Ethical Considerations",
      category: "AI Communication",
      identifierType: "title" as const
    },
    {
      identifier: "Human heuristics for AI-generated language are flawed",
      category: "AI Communication",
      identifierType: "title" as const
    }
    // Add more papers here...
  ];

  buildPaperBankFromList(paperList, {
    generateEmbeddings: false, // Set to true if you want to generate embeddings
    apiKey: process.env.SEMANTIC_SCHOLAR_API_KEY
  }).catch(console.error);
}

export { PaperBankBuilder };
