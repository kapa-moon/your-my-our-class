import { NextRequest, NextResponse } from 'next/server';

interface SemanticScholarAuthor {
  authorId: string;
  name: string;
}

interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract: string;
  year: number;
  authors: SemanticScholarAuthor[];
  citationCount: number;
  openAccessPdf?: {
    url: string;
    status: string;
  };
  url: string;
}

interface SemanticScholarResponse {
  total: number;
  offset: number;
  next?: number;
  data: SemanticScholarPaper[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = searchParams.get('limit') || '10';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Semantic Scholar API endpoint for paper search
    const apiUrl = new URL('https://api.semanticscholar.org/graph/v1/paper/search');
    apiUrl.searchParams.set('query', query);
    apiUrl.searchParams.set('limit', limit);
    apiUrl.searchParams.set('fields', 'paperId,title,abstract,year,authors,citationCount,openAccessPdf,url');

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add API key if available in environment variables
        ...(process.env.SEMANTIC_SCHOLAR_API_KEY && {
          'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY
        })
      }
    });

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Semantic Scholar API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data: SemanticScholarResponse = await response.json();
    
    return NextResponse.json({
      success: true,
      total: data.total,
      papers: data.data.map(paper => ({
        id: paper.paperId,
        title: paper.title,
        abstract: paper.abstract,
        year: paper.year,
        authors: paper.authors?.map(author => ({
          id: author.authorId,
          name: author.name
        })) || [],
        citationCount: paper.citationCount,
        pdfUrl: paper.openAccessPdf?.url,
        semanticScholarUrl: paper.url
      }))
    });

  } catch (error) {
    console.error('Error fetching from Semantic Scholar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
