'use client';

import { useState, useEffect } from 'react';
import { getCurrentUserId } from '@/lib/auth-utils';

interface PersonalizedPaper {
  id: number;
  paperID: string;
  title: string;
  authors: string | null;
  abstract: string | null;
  tldr: string | null;
  doi: string | null;
  openAccessPdf: string | null;
  url: string | null;
  weekNumber: string;
  weekTopic: string;
  relevanceRanking: number;
  matchingReason: string | null;
}

interface PersonalizedPaperProps {
  weekNumber: string;
}

export default function PersonalizedPaper({ weekNumber }: PersonalizedPaperProps) {
  const [papers, setPapers] = useState<PersonalizedPaper[]>([]);
  const [currentPaperIndex, setCurrentPaperIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAbstract, setShowAbstract] = useState(false);

  const userId = getCurrentUserId();
  const currentPaper = papers[currentPaperIndex] || null;

  useEffect(() => {
    if (userId && weekNumber) {
      fetchPersonalizedPapers();
    }
  }, [userId, weekNumber]);

  const fetchPersonalizedPapers = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // First, try to get existing personalized papers
      const response = await fetch(`/api/personalized-papers?userId=${userId}&week=${weekNumber}`);
      const data = await response.json();

      if (response.ok && data.papers && data.papers.length > 0) {
        setPapers(data.papers);
        setCurrentPaperIndex(0);
      } else {
        // No papers exist - they need to generate them from persona card page
        setPapers([]);
        setError('No personalized papers found. Generate them from your Persona Card page first.');
      }
    } catch (err) {
      setError('Failed to fetch personalized papers');
      console.error('Error fetching personalized papers:', err);
    } finally {
      setLoading(false);
    }
  };


  const shufflePaper = () => {
    if (papers.length <= 1) return;
    
    // Move to next paper, cycling back to start after the last one
    const nextIndex = (currentPaperIndex + 1) % papers.length;
    setCurrentPaperIndex(nextIndex);
    setShowAbstract(false); // Reset abstract view when shuffling
  };

  // const getPrimaryLink = (paper: PersonalizedPaper) => {
  //   if (paper.openAccessPdf) return paper.openAccessPdf;
  //   if (paper.doi) return paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`;
  //   if (paper.url) return paper.url;
  //   return null;
  // };

  const parseAuthors = (authors: string | null) => {
    if (!authors) return [];
    return authors.split(',').map(author => author.trim()).filter(Boolean);
  };

  if (!userId) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '6px', fontSize: '0.9rem' }}>
        Please log in to see personalized paper recommendations.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '1rem', color: '#666', fontStyle: 'italic' }}>
        Loading personalized recommendations...
      </div>
    );
  }

  if (error) {
    const isNoGeneration = error.includes('Generate them from your Persona Card');
    
    return (
      <div style={{ 
        padding: '1rem', 
        backgroundColor: isNoGeneration ? '#fff3cd' : '#f8d7da', 
        border: `1px solid ${isNoGeneration ? '#ffeaa7' : '#f5c6cb'}`, 
        borderRadius: '6px', 
        fontSize: '0.9rem', 
        color: isNoGeneration ? '#856404' : '#721c24' 
      }}>
        <strong>{isNoGeneration ? 'Generate Personalized Papers:' : 'Error:'}</strong> {error}
        <br />
        {isNoGeneration ? (
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            color: '#000'
          }}>
            Try the (Re)generate Button on the top. If issue continues, contact the team.
          </div>
        ) : (
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              marginTop: '0.5rem', 
              padding: '0.25rem 0.5rem', 
              fontSize: '0.8rem', 
              background: '#721c24', 
              color: 'white', 
              border: 'none', 
              borderRadius: '3px', 
              cursor: 'pointer' 
            }}
          >
            Refresh Page
          </button>
        )}
      </div>
    );
  }

  if (!currentPaper) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '6px', fontSize: '0.9rem', color: '#856404' }}>
        <strong>Generate Personalized Papers:</strong> No personalized papers available for this week.
        <br />
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.8rem',
          color: '#000'
        }}>
          Try the (Re)generate Button on the top. If issue continues, contact the team.
        </div>
      </div>
    );
  }

  const authorList = parseAuthors(currentPaper.authors);
  // const primaryLink = getPrimaryLink(currentPaper);

  return (
    <div className="personalized-paper-item">
      <style jsx>{`
        .personalized-paper-item {
          padding: 1rem 0;
          border-bottom: 1px solid #450f01;
          margin-bottom: 1rem;
        }
        .personalized-paper-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .personalized-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
        }
        .personalized-badge {
          color: #450f01;
          font-weight: 500;
        }
        .shuffle-button {
          background: none;
          border: 1px solid #450f01;
          color: #450f01;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.2s;
        }
        .shuffle-button:hover {
          background: #450f01;
          color: white;
        }
        .paper-title {
          font-size: 1rem;
          font-weight: normal;
          color: #450f01;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        .paper-authors {
          color: #450f01;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          font-style: italic;
        }
        .paper-meta {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
          align-items: baseline;
        }
        .paper-link {
          color: #450f01;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: normal;
          border-bottom: 1px solid #f97316;
        }
        .paper-link:hover {
          color: #450f01;
          text-decoration: none;
          border-bottom-color: #ea580c;
        }
        .details-toggle {
          background: none;
          border: none;
          color: #450f01;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: normal;
          text-decoration: underline;
          text-decoration-color: #8B4513;
          padding: 0;
        }
        .details-toggle:hover {
          color: #450f01;
          text-decoration-color: #A0522D;
        }
        .tldr-section {
          margin: 0.5rem 0;
          font-size: 0.9rem;
          line-height: 1.5;
        }
        .tldr-label {
          font-weight: bold;
          color: #450f01;
        }
        .tldr-text {
          color: #450f01;
        }
        .abstract-content {
          margin-top: 0.5rem;
          color: #450f01;
          line-height: 1.5;
          font-size: 0.9rem;
        }
        .matching-reason {
          margin-top: 0.75rem;
          padding: 0.5rem;
          background: #FDF5E6;
          border-left: 3px solid #450f01;
          font-size: 0.85rem;
          line-height: 1.4;
          color: #450f01;
        }
        .matching-label {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
      `}</style>

      <div className="personalized-header">
        <div className="personalized-badge">
          🤖 Personalized for You (Rank #{currentPaper.relevanceRanking}/3)
        </div>
        {papers.length > 1 && (
          <button onClick={shufflePaper} className="shuffle-button">
            🔀 Shuffle ({currentPaperIndex + 1}/{papers.length})
          </button>
        )}
      </div>

      <div className="paper-title">
        {currentPaper.title}
      </div>

      {authorList.length > 0 && (
        <div className="paper-authors">
          {authorList.join(', ')}
        </div>
      )}

      <div className="paper-meta">
        {currentPaper.openAccessPdf && (
          <a
            href={currentPaper.openAccessPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="paper-link"
          >
            [PDF]
          </a>
        )}
        
        {currentPaper.doi && (
          <a
            href={currentPaper.doi.startsWith('http') ? currentPaper.doi : `https://doi.org/${currentPaper.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="paper-link"
          >
            [DOI]
          </a>
        )}

        {currentPaper.abstract && (
          <button
            onClick={() => setShowAbstract(!showAbstract)}
            className="details-toggle"
          >
            {showAbstract ? 'Hide Abstract' : 'Show Abstract'}
          </button>
        )}
      </div>

      {currentPaper.tldr && (
        <div className="tldr-section">
          <span className="tldr-label">TL;DR:</span> <span className="tldr-text">{currentPaper.tldr}</span>
        </div>
      )}

      {showAbstract && currentPaper.abstract && (
        <div className="abstract-content">
          {currentPaper.abstract}
        </div>
      )}

      {currentPaper.matchingReason && (
        <div className="matching-reason">
          <div className="matching-label">Why this paper was selected for you:</div>
          <div>{currentPaper.matchingReason}</div>
        </div>
      )}
    </div>
  );
}
