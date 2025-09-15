import { PaperBankBuilder } from './build-paper-bank';
import { requiredPapersList } from './required-papers-list';

// Import database conditionally to avoid connection errors in dry-run mode
let db: any;
let requiredPapers: any;

async function initDatabase() {
  if (!db) {
    const { db: dbInstance } = await import('../lib/db');
    const { requiredPapers: requiredPapersSchema } = await import('../lib/schema');
    db = dbInstance;
    requiredPapers = requiredPapersSchema;
  }
  return { db, requiredPapers };
}

interface RequiredPaperBankEntry {
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
  url: string;
  weekNumber: string;
  weekTopic: string;
}

class RequiredPaperBankBuilder extends PaperBankBuilder {
  /**
   * Transform Semantic Scholar data to our required papers schema
   */
  transformToRequiredPaperBankEntry(
    paper: any, 
    category: string,
    weekNumber: string,
    weekTopic: string,
    providedUrl: string,
    embeddings?: number[]
  ): RequiredPaperBankEntry {
    return {
      paperID: paper.paperId,
      title: paper.title || '',
      authors: paper.authors?.map((author: any) => author.name).join(', ') || '',
      abstract: paper.abstract || '',
      tldr: paper.tldr?.text || '',
      topics: paper.fieldsOfStudy?.join(', ') || '',
      embeddings,
      doi: paper.externalIds?.DOI,
      openAccessPdf: paper.openAccessPdf?.url,
      category,
      url: providedUrl, // Use the provided URL from the professor
      weekNumber,
      weekTopic
    };
  }

  /**
   * Process required papers list and build the database
   */
  async buildRequiredPaperBank(
    generateEmbeddings = false
  ): Promise<RequiredPaperBankEntry[]> {
    const results: RequiredPaperBankEntry[] = [];
    
    console.log(`Processing ${requiredPapersList.length} required papers...`);

    for (let i = 0; i < requiredPapersList.length; i++) {
      const paperInfo = requiredPapersList[i];
      
      console.log(`Processing ${i + 1}/${requiredPapersList.length}: ${paperInfo.title}`);

      let paper: any = null;

      // Search by title
      const searchResults = await this.searchPapers(paperInfo.title, 1);
      if (searchResults.length > 0) {
        paper = searchResults[0];
      }

      if (!paper) {
        console.warn(`Could not find paper: ${paperInfo.title}`);
        // Create a minimal entry with the provided information
        results.push({
          paperID: `manual_${i + 1}`,
          title: paperInfo.title,
          authors: '',
          abstract: '',
          tldr: '',
          topics: '',
          doi: '',
          openAccessPdf: '',
          category: paperInfo.category,
          url: paperInfo.url,
          weekNumber: paperInfo.weekNumber,
          weekTopic: paperInfo.weekTopic
        });
        continue;
      }

      let embeddings: number[] | undefined;
      if (generateEmbeddings) {
        const textForEmbedding = `${paper.title} ${paper.abstract}`.substring(0, 8000);
        embeddings = await this.generateEmbeddings(textForEmbedding);
      }

      const entry = this.transformToRequiredPaperBankEntry(
        paper, 
        paperInfo.category, 
        paperInfo.weekNumber, 
        paperInfo.weekTopic, 
        paperInfo.url,
        embeddings
      );
      results.push(entry);

      // Add delay to respect rate limits
      await this.delay(100);
    }

    return results;
  }

  /**
   * Save required papers to database
   */
  async saveRequiredPapersToDatabase(paperEntries: RequiredPaperBankEntry[]): Promise<void> {
    console.log(`Saving ${paperEntries.length} required papers to database...`);

    const { db, requiredPapers } = await initDatabase();

    for (const entry of paperEntries) {
      try {
        await db.insert(requiredPapers).values({
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
          url: entry.url,
          weekNumber: entry.weekNumber,
          weekTopic: entry.weekTopic,
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoUpdate({
          target: requiredPapers.paperID,
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
            url: entry.url,
            weekNumber: entry.weekNumber,
            weekTopic: entry.weekTopic,
            updatedAt: new Date()
          }
        });

        console.log(`✓ Saved: Week ${entry.weekNumber} - ${entry.title}`);
      } catch (error) {
        console.error(`Failed to save required paper ${entry.paperID}:`, error);
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
export async function buildRequiredPaperBankFromList(
  options: {
    generateEmbeddings?: boolean;
    apiKey?: string;
  } = {}
) {
  const builder = new RequiredPaperBankBuilder(options.apiKey);
  
  try {
    const paperEntries = await builder.buildRequiredPaperBank(
      options.generateEmbeddings || false
    );
    
    await builder.saveRequiredPapersToDatabase(paperEntries);
    
    console.log(`✅ Successfully processed ${paperEntries.length} required papers`);
    return paperEntries;
  } catch (error) {
    console.error('Error building required paper bank:', error);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  buildRequiredPaperBankFromList({
    generateEmbeddings: false, // Set to true if you want to generate embeddings
    apiKey: process.env.SEMANTIC_SCHOLAR_API_KEY
  }).catch(console.error);
}

export { RequiredPaperBankBuilder };
