import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { studentProjects } from '@/lib/schema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get latest version for user
    const project = await db
      .select()
      .from(studentProjects)
      .where(and(
        eq(studentProjects.userId, parseInt(userId)),
        eq(studentProjects.isLatest, true)
      ))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: project[0] || null
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, projectType, projectDescription } = await request.json();

    if (!userId || !projectType) {
      return NextResponse.json({ error: 'User ID and project type required' }, { status: 400 });
    }

    // 1. Mark all previous versions as not latest
    await db
      .update(studentProjects)
      .set({ isLatest: false })
      .where(eq(studentProjects.userId, parseInt(userId)));

    // 2. Get next version number
    const latestVersion = await db
      .select({ version: studentProjects.version })
      .from(studentProjects)
      .where(eq(studentProjects.userId, parseInt(userId)))
      .orderBy(studentProjects.version)
      .limit(1);

    const nextVersion = (latestVersion[0]?.version || 0) + 1;

    // 3. Create new version
    const project = await db
      .insert(studentProjects)
      .values({
        userId: parseInt(userId),
        projectType,
        projectDescription: projectDescription || '',
        version: nextVersion,
        isLatest: true
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: project[0],
      version: nextVersion
    });
  } catch (error) {
    console.error('Error saving project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
