'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Author {
  id: string;
  name: string;
}

interface Paper {
  id: string;
  title: string;
  abstract: string;
  year: number;
  authors: Author[];
  citationCount: number;
  pdfUrl?: string;
  semanticScholarUrl: string;
}

interface SearchResponse {
  success: boolean;
  total: number;
  papers: Paper[];
  error?: string;
}

export default function SemanticScholarDemo() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAbstracts, setExpandedAbstracts] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch(`/api/semantic-scholar?query=${encodeURIComponent(query)}&limit=10`);
      const data: SearchResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch results');
      }

      if (data.success) {
        setResults(data.papers);
        setTotal(data.total);
      } else {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search papers');
    } finally {
      setLoading(false);
    }
  };

  const toggleAbstract = (paperId: string) => {
    const newExpanded = new Set(expandedAbstracts);
    if (newExpanded.has(paperId)) {
      newExpanded.delete(paperId);
    } else {
      newExpanded.add(paperId);
    }
    setExpandedAbstracts(newExpanded);
  };

  const truncateAbstract = (abstract: string) => {
    if (!abstract) return '';
    const sentences = abstract.split('.').filter(s => s.trim().length > 0);
    if (sentences.length <= 2) return abstract;
    return sentences.slice(0, 2).join('.') + '.';
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="border-b border-black">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-normal">Semantic Scholar Raw Recommendations</h1>
            <Link 
              href="/"
              className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your research query (e.g., AI and trust in social interactions)"
              className="flex-1 px-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-black"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-black text-white border border-black hover:bg-gray-800 disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500 transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 border border-red-500 bg-red-50 text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results Summary */}
        {total > 0 && (
          <div className="mb-6 text-gray-600">
            Found {total.toLocaleString()} papers. Showing top {results.length} results.
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((paper) => (
              <div key={paper.id} className="border border-gray-300 p-6">
                {/* Title */}
                <h2 className="text-xl font-medium mb-3">
                  <a
                    href={paper.semanticScholarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black hover:underline"
                  >
                    {paper.title}
                  </a>
                </h2>

                {/* Authors and Year */}
                <div className="mb-3 text-gray-700">
                  <span className="font-medium">Authors:</span>{' '}
                  {paper.authors.length > 0 
                    ? paper.authors.map(author => author.name).join(', ')
                    : 'Unknown'
                  }
                  {paper.year && (
                    <span className="ml-4">
                      <span className="font-medium">Year:</span> {paper.year}
                    </span>
                  )}
                </div>

                {/* Citation Count */}
                <div className="mb-3 text-gray-700">
                  <span className="font-medium">Citations:</span> {paper.citationCount || 0}
                </div>

                {/* Abstract */}
                {paper.abstract && (
                  <div className="mb-4">
                    <div className="text-gray-800 leading-relaxed">
                      {expandedAbstracts.has(paper.id) 
                        ? paper.abstract 
                        : truncateAbstract(paper.abstract)
                      }
                    </div>
                    {paper.abstract.split('.').length > 2 && (
                      <button
                        onClick={() => toggleAbstract(paper.id)}
                        className="mt-2 text-black underline hover:no-underline"
                      >
                        {expandedAbstracts.has(paper.id) ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                )}

                {/* Links */}
                <div className="flex gap-4">
                  <a
                    href={paper.semanticScholarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 border border-black text-black hover:bg-black hover:text-white transition-colors text-sm"
                  >
                    View on Semantic Scholar
                  </a>
                  {paper.pdfUrl && (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-black text-white border border-black hover:bg-gray-800 transition-colors text-sm"
                    >
                      PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && query && results.length === 0 && !error && (
          <div className="text-center py-12 text-gray-600">
            No papers found for &ldquo;{query}&rdquo;. Try a different search term.
          </div>
        )}

        {/* Instructions */}
        {results.length === 0 && !loading && !query && (
          <div className="text-center py-12 space-y-4">
            <p className="text-gray-600">
              Enter a research query to search for academic papers using the Semantic Scholar API.
            </p>
            <p className="text-sm text-gray-500">
              Example queries: &ldquo;machine learning&rdquo;, &ldquo;climate change&rdquo;, &ldquo;AI and trust in social interactions&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
