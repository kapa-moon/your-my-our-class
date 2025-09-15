#!/usr/bin/env tsx

// This script saves the successfully fetched paper data to the database
// Run this after papers have been fetched to avoid re-fetching

import { db } from '../lib/db';
import { papers } from '../lib/schema';

const fetchedPapers = [
  // Add the successfully fetched papers here
  // This would normally be saved to a file during the fetch process
];

async function savePapers() {
  console.log('🚀 Saving fetched papers to database...');
  
  if (fetchedPapers.length === 0) {
    console.log('❌ No papers to save. Please run the fetch script first.');
    return;
  }

  for (const entry of fetchedPapers) {
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
        url: entry.url,
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
          url: entry.url,
          updatedAt: new Date()
        }
      });

      console.log(`✓ Saved: ${entry.title}`);
    } catch (error) {
      console.error(`Failed to save paper ${entry.paperID}:`, error);
    }
  }

  console.log(`✅ Successfully saved ${fetchedPapers.length} papers!`);
}

if (require.main === module) {
  savePapers().catch(console.error);
}
