import { papers } from './schema';
import { papersSeedData } from '../data/papers-seed';
import { db } from './db';

export async function seedPapers() {
  try {
    console.log('🌱 Starting to seed papers...');
    
    // Insert all papers
    const insertedPapers = await db.insert(papers).values(papersSeedData).returning();
    
    console.log(`✅ Successfully seeded ${insertedPapers.length} papers`);
    return insertedPapers;
  } catch (error) {
    console.error('❌ Error seeding papers:', error);
    throw error;
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedPapers()
    .then(() => {
      console.log('🎉 Paper seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Paper seeding failed:', error);
      process.exit(1);
    });
}
