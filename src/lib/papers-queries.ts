import { papers } from './schema';
import { sql, ilike, or, and, eq } from 'drizzle-orm';
import { db } from './db';

export interface PaperSearchOptions {
  topic?: string;
  keyword?: string;
  author?: string;
  professorName?: string;
  limit?: number;
  offset?: number;
}

export interface Paper {
  id: number;
  title: string;
  authors: string | null;
  abstract: string | null;
  url: string | null;
  keywords: string | null;
  professorIntent: string | null;
  topics: string | null;
  professorName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * Search papers by topic, keyword, or other criteria
 */
export async function searchPapers(options: PaperSearchOptions = {}): Promise<Paper[]> {
  const { topic, keyword, author, professorName, limit = 50, offset = 0 } = options;
  
  // Build WHERE conditions
  const conditions = [];
  
  if (topic) {
    conditions.push(
      or(
        ilike(papers.topics, `%${topic}%`),
        ilike(papers.title, `%${topic}%`),
        ilike(papers.keywords, `%${topic}%`)
      )
    );
  }
  
  if (keyword) {
    conditions.push(
      or(
        ilike(papers.keywords, `%${keyword}%`),
        ilike(papers.title, `%${keyword}%`),
        ilike(papers.abstract, `%${keyword}%`),
        ilike(papers.professorIntent, `%${keyword}%`)
      )
    );
  }
  
  if (author) {
    conditions.push(ilike(papers.authors, `%${author}%`));
  }
  
  if (professorName) {
    conditions.push(ilike(papers.professorName, `%${professorName}%`));
  }
  
  if (conditions.length > 0) {
    return await db
      .select()
      .from(papers)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  } else {
    return await db
      .select()
      .from(papers)
      .limit(limit)
      .offset(offset);
  }
}

/**
 * Get all papers by a specific professor
 */
export async function getPapersByProfessor(professorName: string): Promise<Paper[]> {
  return await db
    .select()
    .from(papers)
    .where(ilike(papers.professorName, `%${professorName}%`));
}

/**
 * Get papers by topic/theme
 */
export async function getPapersByTopic(topic: string): Promise<Paper[]> {
  return await db
    .select()
    .from(papers)
    .where(
      or(
        ilike(papers.topics, `%${topic}%`),
        ilike(papers.title, `%${topic}%`),
        ilike(papers.keywords, `%${topic}%`)
      )
    );
}

/**
 * Get papers by keyword
 */
export async function getPapersByKeyword(keyword: string): Promise<Paper[]> {
  return await db
    .select()
    .from(papers)
    .where(
      or(
        ilike(papers.keywords, `%${keyword}%`),
        ilike(papers.title, `%${keyword}%`),
        ilike(papers.abstract, `%${keyword}%`)
      )
    );
}

/**
 * Get all unique topics from papers
 */
export async function getAllTopics(): Promise<string[]> {
  const results = await db
    .select({ topics: papers.topics })
    .from(papers)
    .where(sql`${papers.topics} IS NOT NULL`);
  
  const topicsSet = new Set<string>();
  results.forEach(row => {
    if (row.topics) {
      const topics = row.topics.split(',').map(t => t.trim());
      topics.forEach(topic => topicsSet.add(topic));
    }
  });
  
  return Array.from(topicsSet).sort();
}

/**
 * Get all unique keywords from papers
 */
export async function getAllKeywords(): Promise<string[]> {
  const results = await db
    .select({ keywords: papers.keywords })
    .from(papers)
    .where(sql`${papers.keywords} IS NOT NULL`);
  
  const keywordsSet = new Set<string>();
  results.forEach(row => {
    if (row.keywords) {
      const keywords = row.keywords.split(',').map(k => k.trim());
      keywords.forEach(keyword => keywordsSet.add(keyword));
    }
  });
  
  return Array.from(keywordsSet).sort();
}

/**
 * Get all unique professor names
 */
export async function getAllProfessors(): Promise<string[]> {
  const results = await db
    .selectDistinct({ professorName: papers.professorName })
    .from(papers)
    .where(sql`${papers.professorName} IS NOT NULL`);
  
  return results
    .map(row => row.professorName)
    .filter(name => name !== null)
    .sort() as string[];
}

/**
 * Get a single paper by ID
 */
export async function getPaperById(id: number): Promise<Paper | null> {
  const results = await db
    .select()
    .from(papers)
    .where(eq(papers.id, id))
    .limit(1);
  
  return results[0] || null;
}

/**
 * Get all papers with pagination
 */
export async function getAllPapers(limit = 50, offset = 0): Promise<Paper[]> {
  return await db
    .select()
    .from(papers)
    .limit(limit)
    .offset(offset);
}

/**
 * Advanced search with multiple filters
 */
export async function advancedSearch(filters: {
  searchTerm?: string;
  topics?: string[];
  keywords?: string[];
  professors?: string[];
  limit?: number;
  offset?: number;
}): Promise<Paper[]> {
  const { searchTerm, topics, keywords, professors, limit = 50, offset = 0 } = filters;
  
  const conditions = [];
  
  // General search term
  if (searchTerm) {
    conditions.push(
      or(
        ilike(papers.title, `%${searchTerm}%`),
        ilike(papers.abstract, `%${searchTerm}%`),
        ilike(papers.keywords, `%${searchTerm}%`),
        ilike(papers.topics, `%${searchTerm}%`),
        ilike(papers.professorIntent, `%${searchTerm}%`)
      )
    );
  }
  
  // Topic filters
  if (topics && topics.length > 0) {
    const topicConditions = topics.map(topic => 
      ilike(papers.topics, `%${topic}%`)
    );
    conditions.push(or(...topicConditions));
  }
  
  // Keyword filters
  if (keywords && keywords.length > 0) {
    const keywordConditions = keywords.map(keyword => 
      ilike(papers.keywords, `%${keyword}%`)
    );
    conditions.push(or(...keywordConditions));
  }
  
  // Professor filters
  if (professors && professors.length > 0) {
    const professorConditions = professors.map(prof => 
      ilike(papers.professorName, `%${prof}%`)
    );
    conditions.push(or(...professorConditions));
  }
  
  if (conditions.length > 0) {
    return await db
      .select()
      .from(papers)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  } else {
    return await db
      .select()
      .from(papers)
      .limit(limit)
      .offset(offset);
  }
}
