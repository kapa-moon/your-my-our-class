// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local' });

import { users } from '../lib/schema';
import { db } from '../lib/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// New password assignments for existing students
const studentPasswordUpdates = [
  { name: 'student1', newPassword: 'eJI52q0*' },
  { name: 'student2', newPassword: '96@4KleL' },
  { name: 'student3', newPassword: '2Mu7WZ<7' },
  { name: 'student4', newPassword: 'n]0$O7Z7' },
  { name: 'student5', newPassword: '828[;Z*k' },
  { name: 'student6', newPassword: 's+6W(70n' },
  { name: 'student7', newPassword: 'iG53Pa8(' },
  { name: 'student8', newPassword: 'ILH10~x7' },
  { name: 'student9', newPassword: 'L4v{056;' },
  { name: 'student10', newPassword: 'tY\'21`4£' },
];

// New test user to create
const testUser = {
  name: 'student_test',
  password: 'testtest'
};

// Hash password function
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function updateStudentPasswords() {
  try {
    console.log('🔄 Starting to update student passwords...');
    
    // Update existing student passwords
    for (const update of studentPasswordUpdates) {
      const hashedPassword = await hashPassword(update.newPassword);
      
      const result = await db.update(users)
        .set({ passwordHash: hashedPassword })
        .where(eq(users.name, update.name))
        .returning();
      
      if (result.length > 0) {
        console.log(`✅ Updated password for ${update.name}`);
      } else {
        console.log(`⚠️  User ${update.name} not found`);
      }
    }
    
    console.log('\n👤 Creating test user...');
    
    // Check if test user already exists
    const existingTestUser = await db.select()
      .from(users)
      .where(eq(users.name, testUser.name))
      .limit(1);
    
    if (existingTestUser.length > 0) {
      // Update existing test user
      const hashedPassword = await hashPassword(testUser.password);
      await db.update(users)
        .set({ passwordHash: hashedPassword })
        .where(eq(users.name, testUser.name));
      console.log(`✅ Updated existing test user: ${testUser.name}`);
    } else {
      // Create new test user
      const hashedPassword = await hashPassword(testUser.password);
      const [newUser] = await db.insert(users).values({
        name: testUser.name,
        passwordHash: hashedPassword,
        isGuest: false,
      }).returning();
      console.log(`✅ Created new test user: ${testUser.name} (ID: ${newUser.id})`);
    }
    
    console.log('\n📋 Updated credentials summary:');
    console.log('=====================================');
    studentPasswordUpdates.forEach((student) => {
      console.log(`${student.name}: ${student.newPassword}`);
    });
    console.log(`${testUser.name}: ${testUser.password}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
    throw error;
  }
}

// Function to display all current credentials
export function displayUpdatedCredentials() {
  console.log('\n📚 UPDATED STUDENT LOGIN CREDENTIALS FOR SHARING:');
  console.log('================================================');
  
  studentPasswordUpdates.forEach((student, index) => {
    console.log(`Student ${index + 1}:`);
    console.log(`  Username: ${student.name}`);
    console.log(`  Password: ${student.newPassword}`);
    console.log('');
  });
  
  console.log('Test User:');
  console.log(`  Username: ${testUser.name}`);
  console.log(`  Password: ${testUser.password}`);
  console.log('');
  
  console.log('📋 Instructions for Students:');
  console.log('1. Go to your application login page');
  console.log('2. Use the username and password provided above');
  console.log('3. Each student should use their assigned credentials');
}

// Run if this file is executed directly
if (require.main === module) {
  updateStudentPasswords()
    .then(() => {
      console.log('\n🎉 Password update completed!');
      displayUpdatedCredentials();
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Password update failed:', error);
      process.exit(1);
    });
}
