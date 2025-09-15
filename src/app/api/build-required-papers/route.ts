import { NextRequest, NextResponse } from 'next/server';
import { buildRequiredPaperBankFromList } from '../../../scripts/build-required-papers';
import { requiredPapersList } from '../../../scripts/required-papers-list';

export async function POST(request: NextRequest) {
  try {
    const { generateEmbeddings = false } = await request.json().catch(() => ({}));

    console.log('🚀 Starting Required Paper Bank Builder via API');
    console.log(`📊 Processing ${requiredPapersList.length} required papers`);
    console.log(`🧠 Generate embeddings: ${generateEmbeddings ? 'Yes' : 'No'}`);

    const results = await buildRequiredPaperBankFromList({
      generateEmbeddings,
      apiKey: process.env.SEMANTIC_SCHOLAR_API_KEY
    });

    console.log('✅ Required Paper Bank Builder completed successfully!');
    console.log(`📚 Processed ${results.length} required papers`);

    // Summary by week
    const weekCount = results.reduce((acc, paper) => {
      const key = `Week ${paper.weekNumber}: ${paper.weekTopic}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      message: 'Required paper bank built successfully',
      totalPapers: results.length,
      weekBreakdown: weekCount,
      papers: results.map(p => ({
        paperID: p.paperID,
        title: p.title,
        weekNumber: p.weekNumber,
        weekTopic: p.weekTopic,
        category: p.category,
        authors: p.authors
      }))
    });

  } catch (error) {
    console.error('❌ Error building required paper bank:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to build required paper bank',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Required Paper Bank Builder API',
    usage: 'POST to this endpoint to build the required paper bank',
    totalPapers: requiredPapersList.length,
    weeks: Object.keys(requiredPapersList.reduce((acc, paper) => {
      acc[`Week ${paper.weekNumber}: ${paper.weekTopic}`] = true;
      return acc;
    }, {} as Record<string, boolean>))
  });
}
