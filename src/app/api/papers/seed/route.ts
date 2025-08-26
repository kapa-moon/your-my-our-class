import { NextResponse } from 'next/server';
import { seedPapers } from '@/lib/seed-papers';

export async function POST() {
  try {
    console.log('Starting paper seeding via API...');
    const insertedPapers = await seedPapers();
    
    return NextResponse.json({
      message: 'Papers seeded successfully',
      count: insertedPapers.length,
      papers: insertedPapers
    });
  } catch (error) {
    console.error('Error seeding papers via API:', error);
    return NextResponse.json(
      { error: 'Failed to seed papers', details: error },
      { status: 500 }
    );
  }
}
