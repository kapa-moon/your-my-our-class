import { NextRequest, NextResponse } from 'next/server';
import { 
  searchPapers, 
  getAllPapers, 
  getAllTopics, 
  getAllKeywords, 
  getAllProfessors,
  advancedSearch 
} from '@/lib/papers-queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const topic = searchParams.get('topic');
    const keyword = searchParams.get('keyword');
    const author = searchParams.get('author');
    const professorName = searchParams.get('professor');
    const searchTerm = searchParams.get('search');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Handle different actions
    switch (action) {
      case 'topics':
        const topics = await getAllTopics();
        return NextResponse.json({ topics });
        
      case 'keywords':
        const keywords = await getAllKeywords();
        return NextResponse.json({ keywords });
        
      case 'professors':
        const professors = await getAllProfessors();
        return NextResponse.json({ professors });
        
      case 'advanced':
        // Advanced search with multiple filters
        const topicsFilter = searchParams.get('topics')?.split(',').filter(Boolean) || [];
        const keywordsFilter = searchParams.get('keywords')?.split(',').filter(Boolean) || [];
        const professorsFilter = searchParams.get('professors')?.split(',').filter(Boolean) || [];
        
        const advancedResults = await advancedSearch({
          searchTerm: searchTerm || undefined,
          topics: topicsFilter.length > 0 ? topicsFilter : undefined,
          keywords: keywordsFilter.length > 0 ? keywordsFilter : undefined,
          professors: professorsFilter.length > 0 ? professorsFilter : undefined,
          limit,
          offset
        });
        
        return NextResponse.json({ 
          papers: advancedResults,
          count: advancedResults.length,
          limit,
          offset
        });
        
      default:
        // Regular search or get all papers
        let papers;
        
        if (topic || keyword || author || professorName || searchTerm) {
          // Search with specific criteria
          papers = await searchPapers({
            topic: topic || undefined,
            keyword: keyword || searchTerm || undefined,
            author: author || undefined,
            professorName: professorName || undefined,
            limit,
            offset
          });
        } else {
          // Get all papers
          papers = await getAllPapers(limit, offset);
        }
        
        return NextResponse.json({ 
          papers,
          count: papers.length,
          limit,
          offset
        });
    }
  } catch (error) {
    console.error('Error in papers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
