// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../lib/db';
import { users } from '../lib/schema';
import { eq, and } from 'drizzle-orm';

// Current student credentials
const studentCredentials = [
  { name: 'student1', password: 'eJI52q0*' },
  { name: 'student2', password: '96@4KleL' },
  { name: 'student3', password: '2Mu7WZ<7' },
  { name: 'student4', password: 'n]0$O7Z7' },
  { name: 'student5', password: '828[;Z*k' },
  { name: 'student6', password: 's+6W(70n' },
  { name: 'student7', password: 'iG53Pa8(' },
  { name: 'student8', password: 'ILH10~x7' },
  { name: 'student9', password: 'L4v{056;' },
  { name: 'student10', password: 'tY\'21`4£' },
];

// Test user credential
const testUserCredential = { name: 'student_test', password: 'testtest' };

// Pilot user credentials
const pilotCredentials = [
  { name: 'pilot1', password: '[o;py2' },
  { name: 'pilot2', password: '[o;py3' },
  { name: 'pilot3', password: '[o;py4' },
  { name: 'pilot4', password: '[o;py5' },
  { name: 'pilot5', password: '[o;py6' },
];

async function showStudentCredentials() {
  try {
    console.log('🔍 Checking student users in database...\n');
    
    // Get all student users from database
    const studentUsers = await db.select()
      .from(users)
      .where(and(
        eq(users.isGuest, false)
      ));
    
    const studentAccounts = studentUsers.filter(user => 
      (user.name.startsWith('student') && (user.name.match(/^student\d+$/) || user.name === 'student_test')) ||
      user.name.startsWith('pilot')
    );
    
    console.log(`✅ Found ${studentAccounts.length} student accounts in database:`);
    
    studentAccounts.forEach((user) => {
      console.log(`   ${user.name} (ID: ${user.id}) - Created: ${user.createdAt?.toLocaleString()}`);
    });
    
    console.log('\n📚 STUDENT LOGIN CREDENTIALS FOR SHARING:');
    console.log('==========================================');
    studentCredentials.forEach((student, index) => {
      console.log(`Student ${index + 1}:`);
      console.log(`  Username: ${student.name}`);
      console.log(`  Password: ${student.password}`);
      console.log('');
    });
    
    console.log('Test User:');
    console.log(`  Username: ${testUserCredential.name}`);
    console.log(`  Password: ${testUserCredential.password}`);
    console.log('');
    
    console.log('🧪 PILOT USERS:');
    console.log('================');
    pilotCredentials.forEach((pilot, index) => {
      console.log(`Pilot ${index + 1}:`);
      console.log(`  Username: ${pilot.name}`);
      console.log(`  Password: ${pilot.password}`);
      console.log('');
    });
    
    console.log('Note: Each user has a unique password for security.');
    console.log('\n📋 Instructions for Students:');
    console.log('1. Go to your application login page');
    console.log('2. Use the username and password provided above');
    console.log('3. Each student should use their assigned credentials (student1, student2, etc.)');
    
  } catch (error) {
    console.error('❌ Error checking student credentials:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  showStudentCredentials()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Failed to show credentials:', error);
      process.exit(1);
    });
}

export { showStudentCredentials };
