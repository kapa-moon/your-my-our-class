// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local' });

import { users } from './schema';
import { db } from './db';
import bcrypt from 'bcryptjs';

// Student user data with simple, shareable credentials
const studentUsers = [
  { name: 'student1', password: 'class2024' },
  { name: 'student2', password: 'class2024' },
  { name: 'student3', password: 'class2024' },
  { name: 'student4', password: 'class2024' },
  { name: 'student5', password: 'class2024' },
  { name: 'student6', password: 'class2024' },
  { name: 'student7', password: 'class2024' },
  { name: 'student8', password: 'class2024' },
  { name: 'student9', password: 'class2024' },
  { name: 'student10', password: 'class2024' },
];

// Hash password function
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function seedUsers() {
  try {
    console.log('🌱 Starting to seed student users...');
    
    // Prepare user data with hashed passwords
    const usersToInsert = await Promise.all(
      studentUsers.map(async (student) => ({
        name: student.name,
        passwordHash: await hashPassword(student.password),
        isGuest: false,
      }))
    );
    
    // Insert all users
    const insertedUsers = await db.insert(users).values(usersToInsert).returning();
    
    console.log(`✅ Successfully seeded ${insertedUsers.length} student users`);
    console.log('📋 Created users:');
    insertedUsers.forEach((user, index) => {
      console.log(`   ${user.name} (ID: ${user.id}) - Password: ${studentUsers[index].password}`);
    });
    
    return insertedUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
}

// Function to display credentials for sharing
export function displayStudentCredentials() {
  console.log('\n📚 STUDENT LOGIN CREDENTIALS FOR SHARING:');
  console.log('==========================================');
  studentUsers.forEach((student, index) => {
    console.log(`Student ${index + 1}:`);
    console.log(`  Username: ${student.name}`);
    console.log(`  Password: ${student.password}`);
    console.log('');
  });
  console.log('Note: All students use the same password for simplicity.');
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedUsers()
    .then(() => {
      console.log('🎉 User seeding completed!');
      displayStudentCredentials();
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 User seeding failed:', error);
      process.exit(1);
    });
}
