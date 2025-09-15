'use client';

import { useState } from 'react';

interface Paper {
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
}

interface PaperCardProps {
  paper: Paper;
  showWeekInfo?: boolean;
}

export default function PaperCard({ paper, showWeekInfo = false }: PaperCardProps) {
  // const [showFullAbstract, setShowFullAbstract] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Truncate abstract to first 200 characters
  // const truncateText = (text: string, maxLength: number = 200) => {
  //   if (text.length <= maxLength) return text;
  //   return text.substring(0, maxLength) + '...';
  // };

  // Parse authors string
  const parseAuthors = (authors: string | null) => {
    if (!authors) return [];
    return authors.split(',').map(author => author.trim()).filter(Boolean);
  };

  const authorList = parseAuthors(paper.authors);
  const hasAbstract = paper.abstract && paper.abstract.trim().length > 0;
  const hasTldr = paper.tldr && paper.tldr.trim().length > 0;

  return (
    <div className="paper-item">
      <style jsx>{`
        .paper-item {
          padding: 1rem 0;
          border-bottom: 1px solid #000;
          margin-bottom: 1rem;
        }
        .paper-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .paper-title {
          font-size: 1rem;
          font-weight: normal;
          color: #000;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        .paper-authors {
          color: #000;
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
          color: #000;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: normal;
          border-bottom: 1px solid #f97316;
        }
        .paper-link:hover {
          color: #000;
          text-decoration: none;
          border-bottom-color: #ea580c;
        }
        .details-toggle {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: normal;
          text-decoration: underline;
          text-decoration-color: #d1d5db;
          padding: 0;
        }
        .details-toggle:hover {
          color: #4b5563;
          text-decoration-color: #9ca3af;
        }
        .paper-details {
          margin-top: 0.5rem;
        }
        .tldr-inline {
          margin: 0.5rem 0;
          line-height: 1.5;
        }
        .tldr-label {
          font-weight: bold;
          color: #000;
          font-size: 0.9rem;
        }
        .tldr-text {
          color: #000;
          font-size: 0.9rem;
          font-weight: normal;
        }
        .abstract-section {
          margin-top: 0.5rem;
        }
        .abstract-label {
          font-weight: bold;
          color: #000;
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }
        .abstract-text {
          color: #000;
          line-height: 1.5;
          font-size: 0.9rem;
        }
        .abstract-toggle {
          color: #6b7280;
          cursor: pointer;
          text-decoration: underline;
          text-decoration-color: #d1d5db;
          font-size: 0.9rem;
          margin-left: 0.5rem;
        }
        .abstract-toggle:hover {
          color: #4b5563;
          text-decoration-color: #9ca3af;
        }
        .week-badge {
          display: inline-block;
          background: #f3f4f6;
          color: #374151;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
      `}</style>

      {showWeekInfo && (
        <div className="week-badge">
          Week {paper.weekNumber}: {paper.weekTopic}
        </div>
      )}

      <div className="paper-title">
        {paper.title}
      </div>

      {authorList.length > 0 && (
        <div className="paper-authors">
          {authorList.join(', ')}
        </div>
      )}

      <div className="paper-meta">
        {paper.openAccessPdf && (
          <a
            href={paper.openAccessPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="paper-link"
          >
            [PDF]
          </a>
        )}
        
        {paper.doi && (
          <a
            href={paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="paper-link"
          >
            [DOI]
          </a>
        )}
        
        {/* Only show Semantic Scholar link if no DOI */}
        {paper.url && !paper.doi && (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="paper-link"
          >
            [Semantic Scholar]
          </a>
        )}

        {hasAbstract && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="details-toggle"
          >
            {showDetails ? 'Hide Abstract' : 'Show Abstract'}
          </button>
        )}
      </div>

      {/* Inline TL;DR */}
      {hasTldr && (
        <div className="tldr-inline">
          <span className="tldr-label">TL;DR:</span> <span className="tldr-text">{paper.tldr}</span>
        </div>
      )}

      {showDetails && hasAbstract && (
        <div className="paper-details">
          <div className="abstract-section">
            <div className="abstract-label">Abstract</div>
            <div className="abstract-text">
              {paper.abstract}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}