// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local' });

import { users } from '../lib/schema';
import { db } from '../lib/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Pilot user data with specified passwords
const pilotUsers = [
  { name: 'pilot1', password: '[o;py2' },
  { name: 'pilot2', password: '[o;py3' },
  { name: 'pilot3', password: '[o;py4' },
  { name: 'pilot4', password: '[o;py5' },
  { name: 'pilot5', password: '[o;py6' },
];

// Hash password function
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function createPilotUsers() {
  try {
    console.log('🚀 Starting to create pilot users...');
    
    const createdUsers = [];
    
    for (const pilot of pilotUsers) {
      // Check if user already exists
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.name, pilot.name))
        .limit(1);
      
      if (existingUser.length > 0) {
        // Update existing user's password
        const hashedPassword = await hashPassword(pilot.password);
        const [updatedUser] = await db.update(users)
          .set({ passwordHash: hashedPassword })
          .where(eq(users.name, pilot.name))
          .returning();
        
        console.log(`✅ Updated existing pilot user: ${pilot.name} (ID: ${updatedUser.id})`);
        createdUsers.push({ ...updatedUser, password: pilot.password });
      } else {
        // Create new user
        const hashedPassword = await hashPassword(pilot.password);
        const [newUser] = await db.insert(users).values({
          name: pilot.name,
          passwordHash: hashedPassword,
          isGuest: false,
        }).returning();
        
        console.log(`✅ Created new pilot user: ${pilot.name} (ID: ${newUser.id})`);
        createdUsers.push({ ...newUser, password: pilot.password });
      }
    }
    
    console.log(`\n🎉 Successfully processed ${createdUsers.length} pilot users!`);
    
    return createdUsers;
  } catch (error) {
    console.error('❌ Error creating pilot users:', error);
    throw error;
  }
}

// Function to display pilot credentials
export function displayPilotCredentials() {
  console.log('\n🧪 PILOT USER LOGIN CREDENTIALS:');
  console.log('=================================');
  
  pilotUsers.forEach((pilot, index) => {
    console.log(`Pilot ${index + 1}:`);
    console.log(`  Username: ${pilot.name}`);
    console.log(`  Password: ${pilot.password}`);
    console.log('');
  });
  
  console.log('📋 Instructions for Pilot Users:');
  console.log('1. Go to your application login page');
  console.log('2. Use the username and password provided above');
  console.log('3. Each pilot should use their assigned credentials');
}

// Run if this file is executed directly
if (require.main === module) {
  createPilotUsers()
    .then(() => {
      console.log('\n🎉 Pilot user creation completed!');
      displayPilotCredentials();
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Pilot user creation failed:', error);
      process.exit(1);
    });
}
