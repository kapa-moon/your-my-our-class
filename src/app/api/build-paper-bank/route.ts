import { NextRequest, NextResponse } from 'next/server';
import { buildPaperBankFromList } from '../../../scripts/build-paper-bank';
import { professorPaperList } from '../../../scripts/professor-paper-list';

export async function POST(request: NextRequest) {
  try {
    const { generateEmbeddings = false } = await request.json().catch(() => ({}));

    console.log('🚀 Starting Paper Bank Builder via API');
    console.log(`📊 Processing ${professorPaperList.length} papers`);
    console.log(`🧠 Generate embeddings: ${generateEmbeddings ? 'Yes' : 'No'}`);

    const results = await buildPaperBankFromList(professorPaperList, {
      generateEmbeddings,
      apiKey: process.env.SEMANTIC_SCHOLAR_API_KEY
    });

    console.log('✅ Paper Bank Builder completed successfully!');
    console.log(`📚 Processed ${results.length} papers`);

    // Summary by category
    const categoryCount = results.reduce((acc, paper) => {
      acc[paper.category] = (acc[paper.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      message: 'Paper bank built successfully',
      totalPapers: results.length,
      categoryBreakdown: categoryCount,
      papers: results.map(p => ({
        paperID: p.paperID,
        title: p.title,
        category: p.category,
        authors: p.authors
      }))
    });

  } catch (error) {
    console.error('❌ Error building paper bank:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to build paper bank',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Paper Bank Builder API',
    usage: 'POST to this endpoint to build the paper bank',
    totalPapers: professorPaperList.length,
    categories: Object.keys(professorPaperList.reduce((acc, paper) => {
      acc[paper.category] = true;
      return acc;
    }, {} as Record<string, boolean>))
  });
}
