import { NextRequest, NextResponse } from 'next/server';
import { registerUser, logSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json();

    if (!name || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name and password are required' 
      }, { status: 400 });
    }

    const result = await registerUser(name, password);

    if (result.success && result.user) {
      // Log the registration
      await logSession(result.user.id, {
        action: 'register',
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
