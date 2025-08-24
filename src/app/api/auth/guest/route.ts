import { NextRequest, NextResponse } from 'next/server';
import { createGuestUser, logSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const result = await createGuestUser();

    if (result.success && result.user) {
      // Log the guest session
      await logSession(result.user.id, {
        action: 'guest_login',
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        sessionId: result.user.sessionId,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Guest API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
