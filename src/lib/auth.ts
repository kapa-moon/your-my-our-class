import { db } from './db';
import { users, userSessions } from './schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  name: string;
  isGuest: boolean;
  sessionId?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Hash password
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Register new user
export async function registerUser(name: string, password: string): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.name, name))
      .limit(1);

    if (existingUser.length > 0) {
      return {
        success: false,
        error: 'User with this name already exists'
      };
    }

    const passwordHash = await hashPassword(password);
    
    const [newUser] = await db.insert(users).values({
      name,
      passwordHash,
      isGuest: false,
    }).returning();

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        isGuest: false,
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Registration failed'
    };
  }
}

// Login existing user
export async function loginUser(name: string, password: string): Promise<AuthResult> {
  try {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.name, name))
      .limit(1);

    if (!user || !user.passwordHash) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        isGuest: false,
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Login failed'
    };
  }
}

// Create guest user
export async function createGuestUser(): Promise<AuthResult> {
  try {
    const sessionId = uuidv4();
    const guestName = `Guest_${Date.now()}`;
    
    const [newUser] = await db.insert(users).values({
      name: guestName,
      passwordHash: null,
      isGuest: true,
      sessionId,
    }).returning();

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        isGuest: true,
        sessionId,
      }
    };
  } catch (error) {
    console.error('Guest user creation error:', error);
    return {
      success: false,
      error: 'Failed to create guest session'
    };
  }
}

// Log session activity
export async function logSession(userId: number, sessionData: any): Promise<void> {
  try {
    await db.insert(userSessions).values({
      userId,
      sessionData: JSON.stringify(sessionData),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
  } catch (error) {
    console.error('Failed to log session:', error);
  }
}
