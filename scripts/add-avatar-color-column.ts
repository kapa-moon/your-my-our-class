// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function addAvatarColorColumn() {
  try {
    console.log('Adding avatar_color column to persona_cards table...');
    
    // Execute the SQL to add the column
    await db.execute(sql`ALTER TABLE "persona_cards" ADD COLUMN "avatar_color" text`);
    
    console.log('✅ Successfully added avatar_color column!');
    console.log('You can now use the avatar color picker feature.');
    
    process.exit(0);
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('✅ Column avatar_color already exists - no action needed.');
      process.exit(0);
    } else {
      console.error('❌ Error adding avatar_color column:', error.message);
      process.exit(1);
    }
  }
}

addAvatarColorColumn();
