'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PaperCard from '@/components/PaperCard';
import PersonalizedPaper from '@/components/PersonalizedPaper';
import { getCurrentUserId } from '@/lib/auth-utils';

interface RequiredPaper {
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

export default function SyllabusPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tocItems, setTocItems] = useState<Array<{id: string, text: string, level: number}>>([]);
  const [presentationDetailsOpen, setPresentationDetailsOpen] = useState(false);
  const [optionalReadingDetailsOpen, setOptionalReadingDetailsOpen] = useState(false);
  const [requiredPapers, setRequiredPapers] = useState<RequiredPaper[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState<string>('');
  const [generationComplete, setGenerationComplete] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Get current user ID
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      setUserId(currentUserId);
    }
  }, []);

  // Fetch required papers
  useEffect(() => {
    const fetchRequiredPapers = async () => {
      try {
        const response = await fetch('/api/required-papers');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setRequiredPapers(data.papers);
          }
        }
      } catch (error) {
        console.error('Failed to fetch required papers:', error);
      } finally {
        setLoadingPapers(false);
      }
    };

    fetchRequiredPapers();
  }, []);

  useEffect(() => {
    // Generate table of contents from h2, h3, and h4 elements
    const headings = document.querySelectorAll('h2, h3, h4');
    const items: Array<{id: string, text: string, level: number}> = [];
    
    let isInScheduleSection = false;
    let isInEvaluationSection = false;
    let isInCoursePoliciesSection = false;
    
    Array.from(headings).forEach((heading, index) => {
      const id = `heading-${index}`;
      heading.id = id;
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName.substring(1));
      
      if (level === 2) {
        isInScheduleSection = text === 'Class Schedule & Readings';
        isInEvaluationSection = text === 'Course Structure and Student Evaluation';
        isInCoursePoliciesSection = text === 'Course Policies';
        // Include all h2 sections in TOC
        items.push({
          id,
          text,
          level
        });
      } else if (level === 3) {
        if (isInScheduleSection && text.includes('Week')) {
          // Include weekly items under Class Schedule & Readings
          items.push({
            id,
            text,
            level
          });
        } else if (isInEvaluationSection && (
          text.includes('Grade Breakdown') || 
          text.includes('Class Participation') || 
          text.includes('Research Project')
        )) {
          // Include main evaluation subsections
          items.push({
            id,
            text,
            level
          });
        } else if (!isInScheduleSection && !isInEvaluationSection && !isInCoursePoliciesSection) {
          // Include other h3 sections, but exclude Course Policies subsections
          items.push({
            id,
            text,
            level
          });
        }
      } else if (level === 4 && isInEvaluationSection && !text.includes('Paper Presentations')) {
        // Include h4 items under Research Project, but exclude Paper Presentations
        items.push({
          id,
          text,
          level
        });
      }
    });
    
    setTocItems(items);
  }, []);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToSection = (sectionText: string) => {
    const headings = document.querySelectorAll('h4');
    Array.from(headings).forEach((heading) => {
      if (heading.textContent?.includes(sectionText)) {
        heading.scrollIntoView({ behavior: 'smooth' });
      }
    });
  };

  // Get papers for a specific week
  const getPapersForWeek = (weekNumber: string): RequiredPaper[] => {
    return requiredPapers.filter(paper => paper.weekNumber === weekNumber);
  };

  const generatePersonalizedSyllabus = async () => {
    if (!userId) {
      alert('Please log in to generate your personalized syllabus.');
      return;
    }

    try {
      setGenerating(true);
      setGenerationMessage('');
      setGenerationComplete(false);

      // Generate papers for weeks 2-9 (content weeks)
      const weeks = ['2', '3', '4', '5', '6', '7', '8', '9'];
      const weekNames = {
        '2': 'AI-Mediated Communication',
        '3': 'LLMs and role play', 
        '4': 'Social Bots',
        '5': 'Models interacting with each other',
        '6': 'Deception and Truth',
        '7': 'LLMs reflecting human diversity',
        '8': 'LLMs as content analysts',
        '9': 'Reflections on human cognition'
      };

      setGenerationMessage('🤖 AI is analyzing your interests and matching papers...');

      let successCount = 0;
      let failCount = 0;

      for (const week of weeks) {
        try {
          setGenerationMessage(`🤖 Generating personalized papers for Week ${week}: ${weekNames[week as keyof typeof weekNames]}...`);
          
          const response = await fetch('/api/personalized-papers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              weekNumber: week,
              forceRegenerate: true // Always regenerate when manually triggered
            })
          });

          const data = await response.json();

          if (response.ok) {
            successCount++;
            console.log(`Generated papers for week ${week}:`, data.papers?.length || 0);
          } else {
            failCount++;
            console.error(`Failed to generate papers for week ${week}:`, data.error);
          }
        } catch (weekError) {
          // failCount++;
          console.error(`Error generating papers for week ${week}:`, weekError);
        }
      }

      if (successCount === weeks.length) {
        setGenerationMessage(`✅ Success! Generated personalized papers for all ${successCount} weeks. Refreshing page...`);
        setGenerationComplete(true);
        // Auto-reload the page after successful generation
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (successCount > 0) {
        setGenerationMessage(`⚠️ Partially successful: Generated papers for ${successCount}/${weeks.length} weeks. Some weeks may have failed. Refreshing page...`);
        setGenerationComplete(true);
        // Auto-reload the page even for partial success to show what was generated
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setGenerationMessage(`❌ Failed to generate personalized papers. Please try again or check your internet connection.`);
        setGenerationComplete(false);
      }

    } catch (error) {
      console.error('Error generating personalized syllabus:', error);
      setGenerationMessage('❌ An error occurred while generating your personalized syllabus. Please try again.');
      setGenerationComplete(false);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <style jsx>{`
        .toggle-icon span {
          font-size: 16px;
          font-weight: normal;
          line-height: 1;
        }
        
        .syllabus-content {
          font-family: var(--font-atkinson-hyperlegible), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        
        .syllabus-content h1, .syllabus-content h2, .syllabus-content h3, .syllabus-content h4 {
          font-family: var(--font-atkinson-hyperlegible), serif;
          color: #222;
          line-height: 1.2;
        }
        .syllabus-content h1 {
          font-size: 2.5em;
          text-align: center;
          border-bottom: 2px solid #eee;
          padding-bottom: 0.5em;
          margin-bottom: 1em;
          font-weight: 700;
        }
        .syllabus-content h2 {
          font-size: 1.8em;
          border-bottom: 1px solid #eee;
          padding-bottom: 0.3em;
          margin-top: 2em;
          font-weight: 700;
        }
        .syllabus-content h3 {
          font-size: 1.4em;
          margin-top: 1.8em;
          font-weight: 600;
        }
        .syllabus-content h4 {
          font-size: 1.1em;
          font-weight: bold;
          margin-top: 1.5em;
        }
        .syllabus-content a {
          color: #007bff;
          text-decoration: none;
        }
        .syllabus-content a:hover {
          text-decoration: underline;
        }
        .syllabus-content ul, .syllabus-content ol {
          padding-left: 20px;
        }
        .syllabus-content li {
          margin-bottom: 0.5em;
        }
        .syllabus-content ul {
          list-style-type: disc;
          margin-left: 1.5em;
        }
        .syllabus-content ul li {
          list-style: disc;
          display: list-item;
        }
        .syllabus-content table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1em;
        }
        .syllabus-content th, .syllabus-content td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .syllabus-content th {
          background-color: #f2f2f2;
        }
        .header-info {
          text-align: center;
          margin-bottom: 2em;
          font-size: 1.1em;
        }
        .grade-breakdown {
          list-style: none;
          padding: 0;
        }
        .grade-breakdown li {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .grade-breakdown > li:not([style]) {
          margin-bottom: 0.5em;
        }
        .grade-breakdown li > span:nth-child(2) {
          text-align: right;
          flex-shrink: 0;
          min-width: 80px;
          margin-left: auto;
          padding-left: 20px;
        }
        .syllabus-content blockquote {
          border-left: 4px solid #ccc;
          padding-left: 1em;
          margin-left: 0;
          font-style: italic;
          color: #555;
        }
        .code, .github-link {
          font-family: 'Atkinson Hyperlegible Mono', 'Reddit Mono', monospace;
          background-color: #f0f0f0;
          padding: 2px 5px;
          border-radius: 4px;
        }
        .sidebar-toggle {
          position: fixed;
          top: 80px;
          left: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(248, 249, 250, 0.9);
          border: 1px solid #dee2e6;
          border-radius: 6px;
          cursor: pointer;
          font-family: var(--font-atkinson-hyperlegible), sans-serif;
          font-size: 14px;
          color: #666;
          padding: 8px 12px;
          transition: all 0.2s;
          z-index: 1001;
          backdrop-filter: blur(8px);
        }
        .sidebar-toggle:hover {
          color: #333;
          background: rgba(248, 249, 250, 0.95);
          border-color: #adb5bd;
        }
        .toggle-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          transition: background-color 0.2s;
        }
        .sidebar-toggle:hover .toggle-icon {
          background-color: #e0e0e0;
        }
        .sidebar {
          position: fixed;
          top: 0;
          left: ${sidebarOpen ? '0' : '-280px'};
          width: 280px;
          height: 100vh;
          padding: 130px 20px 20px 20px;
          overflow-y: auto;
          transition: left 0.3s ease;
          z-index: 999;
          background-color: white;
          border-right: 1px solid #ddd;
        }
        .sidebar h3 {
          font-family: var(--font-atkinson-hyperlegible), serif;
          font-size: 1.1em;
          margin-bottom: 20px;
          color: #333;
          font-weight: 600;
          border-bottom: 1px solid #ddd;
          padding-bottom: 8px;
        }
        .toc-item {
          display: block;
          padding: 6px 0;
          color: #555;
          text-decoration: none;
          margin-bottom: 4px;
          transition: color 0.2s;
          font-size: 14px;
          line-height: 1.4;
          border-bottom: 1px dotted transparent;
        }
        .toc-item:hover {
          color: #333;
          text-decoration: none;
          border-bottom-color: #ccc;
        }
        .toc-item.level-3 {
          padding-left: 16px;
          font-size: 13px;
          color: #777;
        }
        .toc-item.level-3:hover {
          color: #555;
        }
        .toc-item.level-4 {
          padding-left: 32px;
          font-size: 12px;
          color: #888;
        }
        .toc-item.level-4:hover {
          color: #666;
        }
        .details-toggle {
          color: #000;
          text-decoration: underline;
          text-decoration-color: #ff8c00;
          cursor: pointer;
          font-weight: 500;
          display: inline-block;
          margin: 8px 0;
        }
        .details-toggle:hover {
          text-decoration-color: #e67a00;
        }
        .scroll-link {
          color: #000;
          text-decoration: underline;
          text-decoration-color: #ff8c00;
          cursor: pointer;
          font-weight: 600;
        }
        .scroll-link:hover {
          text-decoration-color: #e67a00;
        }
        .options-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin: 1em 0;
        }
        .options-table td {
          padding: 15px;
          border: none;
          vertical-align: top;
        }
        .track-chip {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9em;
          text-align: center;
          min-width: 120px;
        }
        .lit-review-chip {
          color: #8b0088;
          background-color: rgba(255, 173, 255, 0.3);
        }
        .reproducibility-chip {
          color: #006b00;
          background-color: rgba(173, 255, 173, 0.3);
        }
        .project-chip {
          color: #0066cc;
          background-color: rgba(173, 214, 255, 0.3);
        }
        .tbd-highlight {
          background-color: #fff3cd;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          color: #856404;
        }
        .gray-text {
          color: #888;
        }
        .deadline-link {
          color: #000;
          text-decoration: underline;
          text-decoration-color: #ff8c00;
          cursor: pointer;
          font-weight: normal;
        }
        .deadline-link:hover {
          text-decoration-color: #e67a00;
        }
        
        /* Hand-drawn marker styles */
        .marker-highlight {
          background: linear-gradient(104deg, 
            rgba(255, 235, 59, 0.8) 0.9%, 
            rgba(255, 235, 59, 0.7) 2.4%, 
            rgba(255, 235, 59, 0.5) 5.8%, 
            rgba(255, 235, 59, 0.1) 93%, 
            rgba(255, 235, 59, 0.7) 96%, 
            rgba(255, 235, 59, 0.8) 98%),
            linear-gradient(183deg, 
            rgba(255, 235, 59, 0.8) 0%, 
            rgba(255, 235, 59, 0.3) 7.9%, 
            transparent 15%);
          border-radius: 0.2em 0.3em 0.4em 0.1em;
          padding: 0.1em 0.2em;
          transform: rotate(-0.5deg);
          display: inline-block;
        }
        
        .brush-underline {
          position: relative;
        }
        .brush-underline::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, 
            rgba(255, 140, 0, 0.8) 0%, 
            rgba(255, 140, 0, 0.6) 15%, 
            rgba(255, 140, 0, 0.9) 25%, 
            rgba(255, 140, 0, 0.4) 40%, 
            rgba(255, 140, 0, 0.8) 55%, 
            rgba(255, 140, 0, 0.3) 70%, 
            rgba(255, 140, 0, 0.7) 85%, 
            rgba(255, 140, 0, 0.5) 100%);
          border-radius: 50px / 20px;
          transform: scaleX(1.02) rotate(-0.3deg);
        }
        
        .crayon-highlight {
          background: 
            radial-gradient(ellipse at top, rgba(255, 182, 193, 0.8), transparent),
            radial-gradient(ellipse at bottom, rgba(255, 182, 193, 0.6), transparent),
            linear-gradient(45deg, 
              rgba(255, 182, 193, 0.3) 0%, 
              rgba(255, 182, 193, 0.7) 50%, 
              rgba(255, 182, 193, 0.4) 100%);
          padding: 0.1em 0.3em;
          border-radius: 0.3em 0.1em 0.4em 0.2em;
          transform: rotate(0.8deg);
          display: inline-block;
          border: 1px solid rgba(255, 182, 193, 0.3);
        }
        
        .pen-scribble {
          position: relative;
          background: rgba(173, 216, 230, 0.3);
          padding: 0.2em 0.4em;
          border-radius: 0.2em;
        }
        .pen-scribble::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background: repeating-linear-gradient(
            90deg,
            rgba(70, 130, 180, 0.8) 0px,
            rgba(70, 130, 180, 0.8) 3px,
            transparent 3px,
            transparent 7px,
            rgba(70, 130, 180, 0.6) 7px,
            rgba(70, 130, 180, 0.6) 10px,
            transparent 10px,
            transparent 12px
          );
          transform: translateY(-50%) rotate(-0.2deg);
        }
        
        /* Optional Reading Styles */
        .optional-badge {
          display: inline-block;
          background: #fef3c7;
          color: #92400e;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          border: 1px solid #fbbf24;
        }
        .optional-paper-item {
          padding: 1rem 0;
          border-bottom: 1px solid #000;
          margin-bottom: 1rem;
        }
        .optional-paper-title {
          font-size: 1rem;
          font-weight: normal;
          color: #000;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        .optional-paper-authors {
          color: #000;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          font-style: italic;
        }
        .optional-paper-meta {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
          align-items: center;
        }
        .optional-paper-link {
          color: #000;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: normal;
          border-bottom: 1px solid #f97316;
          vertical-align: baseline;
        }
        .optional-paper-link:hover {
          color: #000;
          text-decoration: none;
          border-bottom-color: #ea580c;
        }
        .openai-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: black;
          padding: 0;
          border-radius: 0;
          text-decoration: none;
          border: none;
          font-size: 0.9rem;
          font-weight: normal;
          transition: all 0.2s;
          margin: 0;
          vertical-align: baseline;
        }
        .openai-button:hover {
          background: transparent;
          color: black;
          text-decoration: none;
        }
        .openai-icon {
          width: 16px;
          height: 16px;
          border-radius: 2px;
          background: url(/colorful_pic.png) center/cover;
          flex-shrink: 0;
        }
        .optional-details-toggle {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: normal;
          text-decoration: underline;
          text-decoration-color: #d1d5db;
          padding: 0;
          margin: 0;
          vertical-align: baseline;
        }
        .optional-details-toggle:hover {
          color: #4b5563;
          text-decoration-color: #9ca3af;
        }
        .optional-tldr-inline {
          margin: 0.5rem 0;
          line-height: 1.5;
        }
        .optional-tldr-label {
          font-weight: bold;
          color: #000;
          font-size: 0.9rem;
        }
        .optional-tldr-text {
          color: #000;
          font-size: 0.9rem;
          font-weight: normal;
        }
        .optional-abstract-section {
          margin-top: 0.5rem;
        }
        .optional-abstract-label {
          font-weight: bold;
          color: #000;
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }
        .optional-abstract-text {
          color: #000;
          line-height: 1.5;
          font-size: 0.9rem;
        }
        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.1);
          z-index: 998;
          display: ${sidebarOpen ? 'block' : 'none'};
        }
        @media (min-width: 1200px) {
          .overlay {
            display: none;
          }
        }
      `}</style>
      
      <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
      
      {/* Header */}
      <div className="border-b border-black">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-normal">My Syllabus</h1>
            <div className="flex items-center gap-4">
              {!generating && (
                <div className="text-xs text-gray-500 italic">
                  Takes ~3 minutes to generate
                </div>
              )}
              
              <button
                onClick={generatePersonalizedSyllabus}
                disabled={generating || !userId}
                className={`inline-flex items-center px-4 py-2 border border-black rounded-md font-medium transition-colors ${
                  generating || !userId
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'text-black bg-white hover:bg-black hover:text-white'
                }`}
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
                    Generating...
                  </>
                ) : (
                  '(Re)generate My Syllabus'
                )}
              </button>
              
              <Link 
                href="/"
                className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors rounded-md"
              >
                ← Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Generation Message */}
      {generationMessage && (
        <div className="border-b border-gray-200 bg-blue-50">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <div className="text-sm text-blue-800">
              {generationMessage}
            </div>
          </div>
        </div>
      )}
      
      <button 
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <div className="toggle-icon">
          <span>
            {sidebarOpen ? '←' : '☰'}
          </span>
        </div>
        {sidebarOpen ? 'Hide Outline' : 'Show Outline'}
      </button>
      <div className="sidebar">
        {tocItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`toc-item level-${item.level}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToHeading(item.id);
            }}
          >
            {item.text}
          </a>
        ))}
      </div>
      
      {/* Syllabus Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 syllabus-content">
        <h1>COMM 324: <span className="marker-highlight">Language and Technology</span></h1>
        <div className="header-info">
          <p><strong>Term:</strong> Fall, 2025</p>
          <p><strong>Time:</strong> Wednesdays, 3:30 PM - 5:30 PM</p>
          <p><strong>Location:</strong> Building 120, Room 452</p>
        </div>

        <h2>Instructor</h2>
        <table>
          <tbody>
            <tr>
              <th>Name</th>
              <td>Prof. Jeff Hancock</td>
            </tr>
            <tr>
              <th>Office</th>
              <td>300J McClatchy Hall</td>
            </tr>
            <tr>
              <th>Office Hours</th>
              <td>Wednesdays, 1:00 PM - 2:00 PM</td>
            </tr>
            <tr>
              <th>Phone</th>
              <td>650-723-5499</td>
            </tr>
            <tr>
              <th>Email</th>
              <td><a href="mailto:hancockj@stanford.edu">hancockj@stanford.edu</a> (Best way to reach me)</td>
            </tr>
          </tbody>
        </table>

        <h2>Course Overview</h2>
        <p>
          In this course, we integrate models of language use from psychology and communication with emerging technologies, with this year having a focus on generative AI, in particular Large Language Models (LLMs). We will read and discuss a selection of recent papers at the intersection of communication and computer science.
        </p>
        <p>We will aim to understand:</p>
        <ul>
          <li>How will AI systems influence human communication?</li>
          <li>How human-like in behavior are current AI systems?</li>
          <li>Where can AI be better informed by (recent) advances in cognitive and communication sciences?</li>
          <li>Which ideas from modern AI inspire new approaches to human intelligence and communication?</li>
          <li>What principles of intelligence and communication emerge from comparing humans to modern AI?</li>
        </ul>

        <h2>Course Goals</h2>
        <p>
          The overall goal for the course is to introduce students to thinking about how new language analysis tools like large language models can be examined to understand human language and social dynamics, but also how they can be used to advance social science research, and to develop a research project for the student.
        </p>
        <p>There are multiple objectives intended for a wide variety of student backgrounds and goals including:</p>
        <ul>
          <li>Systematically examining the literature on large language models.</li>
          <li>Evaluating these models, with an emphasis on how examining these models can inform our understanding of human behavior and language and how they can be used to analyze psychological and social dynamics.</li>
          <li>Applying concepts from class and large language models to conduct a project.</li>
        </ul>

        <h2>Course Structure and Student Evaluation</h2>
        
        <p>Evaluation in this course is based on presenting an AI paper to the class, two research papers (a draft and a final) and participation.</p>
        
        <h3>Grade Breakdown</h3>
        <ul className="grade-breakdown">
          <li><span>Class Participation</span> <span><strong>30%</strong></span></li>
          <li>
            <span 
              className="scroll-link"
              onClick={() => scrollToSection('Proposals')}
            >
              1-Page Proposal
            </span> 
            <span><strong>10%</strong></span>
          </li>
          <li>
            <span 
              className="scroll-link"
              onClick={() => scrollToSection('Draft Paper')}
            >
              Draft Paper
            </span> 
            <span><strong>20%</strong></span>
          </li>
          <li style={{marginLeft: '20px', fontSize: '0.9em', color: '#666'}}>
            <span>Draft due to partner at noon on Mon Oct 21</span>
          </li>
          <li style={{marginLeft: '20px', fontSize: '0.9em', color: '#666'}}>
            <span>Comments on draft due to partner Tues Oct 22</span>
          </li>
          <li style={{marginLeft: '20px', fontSize: '0.9em', color: '#666'}}>
            <span className="deadline-link" onClick={() => scrollToSection('Draft Paper')} style={{color: '#000', fontSize: '0.9em'}}>Work on draft with partner in class Wed Oct 23</span>
          </li>
          <li style={{marginLeft: '20px', fontSize: '0.9em', color: '#666'}}>
            <span>Revised draft due before class on Wed Oct 30</span>
          </li>
          <li>
            <span 
              className="scroll-link"
              onClick={() => scrollToSection('Final Paper')}
            >
              Final Paper
            </span> 
            <span><strong>30%</strong></span>
          </li>
          <li style={{marginLeft: '20px', fontSize: '0.9em', color: '#666'}}>
            <span>Draft due to partner at noon on Mon Dec 2</span>
          </li>
          <li style={{marginLeft: '20px', fontSize: '0.9em', color: '#666'}}>
            <span>Comments on draft due to partner Tues Dec 3</span>
          </li>
          <li style={{marginLeft: '20px', fontSize: '0.9em', color: '#666'}}>
            <span>Brief work on draft with partner in class Wed Dec 4</span>
          </li>
          <li style={{marginLeft: '20px', fontSize: '0.9em', color: '#000'}}>
            <span>Revised and final draft due on <strong>Dec 13</strong></span>
          </li>
          <li>
            <span 
              className="scroll-link"
              onClick={() => scrollToSection('Presentations')}
            >
              Presentation (Dec 4)
            </span> 
            <span><strong>10%</strong></span>
          </li>
          <li style={{marginLeft: '20px', fontSize: '0.9em', color: '#666'}}>
            <span>Length: 5-8 minutes</span>
          </li>
        </ul>

        <h3>Class Participation (30%)</h3>
        <p>
          We will have two main readings per class and you are expected to read them carefully and come prepared to discuss.
        </p>
        <p>
          Students must come to class prepared to participate actively. This means having read and thought about each week&apos;s reading prior to class, and being prepared to describe key points, arguments, and questions, and to discuss their research project. You will be called on to do so, and evaluated on your performance. Students are also encouraged to send relevant and interesting articles, links, videos, etc. to the instructor. Doing so will count toward the participation grade.
        </p>

        <h4>Paper Presentations (25%)</h4>
        <p>
          <strong>Presenting 1-2 papers to the class, being responsible for technical details.</strong>
        </p>
        <span 
          className="details-toggle"
          onClick={() => setPresentationDetailsOpen(!presentationDetailsOpen)}
        >
          {presentationDetailsOpen ? 'Hide Details' : 'Show Detailed Requirements'}
        </span>
        
        {presentationDetailsOpen && (
          <ul>
            <li><strong>Length:</strong> Presentations should be no longer than 10 minutes maximum. A bit shorter is fine.</li>
            <li><strong>Preparation:</strong> The goal is for you to be an expert on this paper - read it carefully, look up things you don&apos;t understand, and read the supplement if one exists. You can even skim key references to get more background.</li>
            <li><strong>Format:</strong> Don&apos;t use powerpoint slides unless you need a lot of visual aids that aren&apos;t in the paper: this is an opportunity to practice the skill of walking people through a paper verbally.</li>
            <li><strong>Outline:</strong> Write a clear outline for yourself, but DON&apos;T write out everything you want to say.</li>
            <li><strong>Practice:</strong> Practice your presentation for a friend at least twice so you get the timing right and know what you want to say.</li>
            <li><strong>Content:</strong> Describe 1) the goals of the study and how it connects to prior work, 2) the models being used, 3) the methods of the experiments and/or simulations, 4) the results, and 5) the interpretation.</li>
            <li><strong>Visual aids:</strong> You can also walk people through key display items (graphs, tables, diagrams) in a paper, e.g. &quot;You can see on the left side of Figure 1 what the network looks like, it&apos;s got an input layer, one hidden layer, etc.&quot;</li>
            <li><strong>Questions:</strong> Make sure you end with 2-3 questions about the study and its interpretation.</li>
        </ul>
        )}

        <h3>Research Project (70%)</h3>
        <p>
          <strong>Reports for individuals or groups of two students, with multiple track options:</strong>
        </p>
        
        <h4>Options</h4>
        <table className="options-table">
          <tbody>
            <tr>
              <td>
                <div className="track-chip lit-review-chip">
                  REVIEW Track
                </div>
              </td>
              <td>
                Review in a focused area
              </td>
            </tr>
            <tr>
              <td>
                <div className="track-chip project-chip">
                  EMPIRICAL Track
                </div>
              </td>
              <td>
                Design and implement a novel extension or application of one of the models we read about here or develop a new empirical project
              </td>
            </tr>
            <tr>
              <td>
                <div className="track-chip project-chip">
                  THEORY Track
                </div>
              </td>
              <td>
                New or improved concepts, definitions, models, principles, or frameworks
              </td>
            </tr>
            <tr>
              <td>
                <div className="track-chip reproducibility-chip">
                  REPRODUCIBILITY Track
                </div>
              </td>
              <td>
                Reproduction of &quot;experimental&quot; (simulation/evaluation) results from a paper we read
              </td>
            </tr>
            <tr>
              <td>
                <div className="track-chip" style={{color: '#666', backgroundColor: 'rgba(200, 200, 200, 0.3)'}}>
                  Others
                </div>
              </td>
              <td>
                You can specify later on
              </td>
            </tr>
          </tbody>
        </table>

        <h4>AI Assistance Policy</h4>
        <p>
          We will discuss in class what we think a fair policy is with respect to AI assistance on your projects. <span className="crayon-highlight">TBD</span>
        </p>
        <p className="gray-text">
          You can use any tool that you think is relevant, but you MUST acknowledge which tools you used at the end of the paper in a short statement, e.g. &quot;Used Consensus for literature review, used ChatGPT (4) for editing, and Copilot for help with making the figures.&quot; Please acknowledge explicitly whether any text was authored (first draft or revisions) by an AI tool.
        </p>

        <h4>Proposals (Oct 15)</h4>
        <p>Due in class in Week 4 (1 page, 10%)</p>

        <h4>Draft Paper (Oct 30)</h4>
        <p>
          The draft paper will be approximately 3-4 CHI format pages or 5-8 APA format pages long and will serve as a first draft for the project. The final paper builds on this paper draft. (20%)
        </p>
        <p>
          After the first draft is submitted, another student in class will be tasked with reviewing and revising the paper, and providing suggestions and comments for improving the paper. As such, a digital copy is required to be shared with the partner reviewer. We will provide time in class to discuss and review the paper.
        </p>
        <p>
          Once the revisions and suggestions are received, the student will revise the paper based on those reviews and comments, and create a final draft that will be handed in to the professor.
        </p>

        <h4>Final Paper (Dec 13)</h4>
        <p>
          The final paper will follow the same process and will be no longer than 8 CHI format pages or 15 APA format pages plus references. (30%)
        </p>
        <p>
          Final papers: In <a href="https://chi2025.acm.org/chi-publication-formats/">CHI format</a>, no more than 8 pages + refs or in <a href="https://owl.purdue.edu/owl/research_and_citation/apa_style/apa_formatting_and_style_guide/general_format.html">APA format</a>, no more than 15 pages + refs) and code for any models (on github) are due on Dec 13 (project track will incorporate assessment of the presentation in this score)
        </p>

        <h4>Presentations (Dec 3)</h4>
        <p>
          Reviews, Reproductions and Projects will be presented in class in Week 10. (10%)
        </p>
        <p>
          Upload presentation decks <a href="https://drive.google.com/drive/folders/1zUfiHJvFWMqSxNiBJ-iiPV91xxtxxZsu?usp=drive_link" target="_blank" rel="noopener noreferrer">here</a>.
        </p>

        <h2>Class Schedule & Readings</h2>
        
        <h3>Week 1: Sept 24 - Intro</h3>
        
        <h3>Week 2: Oct 1 - AI-Mediated Communication</h3>
        {loadingPapers ? (
          <div style={{ padding: '1rem', color: '#666', fontStyle: 'italic' }}>Loading papers...</div>
        ) : (
          <div>
            {getPapersForWeek('2').map(paper => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
            <PersonalizedPaper weekNumber="2" />
          </div>
        )}
        
        <div className="optional-paper-item">
          <div className="optional-badge">
            Optional (Highly Recommended)
          </div>

          <div className="optional-paper-title">
            HOW PEOPLE USE CHATGPT
          </div>

          <div className="optional-paper-authors">
            Aaron Chatterji, Thomas Cunningham, David J. Deming, Zoe Hitzig, Christopher Ong, Carl Yan Shan, Kevin Wadman
          </div>

          <div className="optional-paper-meta">
            <a
              href="https://openai.com/index/how-people-are-using-chatgpt/"
              target="_blank"
              rel="noopener noreferrer"
              className="openai-button"
            >
              <div className="openai-icon"></div>
              OpenAI Report
            </a>
            
            <a
              href="https://www.nber.org/papers/w34255"
              target="_blank"
              rel="noopener noreferrer"
              className="optional-paper-link"
            >
              [Paper]
            </a>

            <button
              onClick={() => setOptionalReadingDetailsOpen(!optionalReadingDetailsOpen)}
              className="optional-details-toggle"
            >
              {optionalReadingDetailsOpen ? 'Hide Abstract' : 'Show Abstract'}
            </button>
          </div>

          <div className="optional-tldr-inline">
            <span className="optional-tldr-label">TL;DR:</span> <span className="optional-tldr-text">This study analyzes ChatGPT&apos;s rapid growth to 10% of the world&apos;s adult population and finds that while work-related usage has grown steadily, non-work usage has expanded even faster (from 53% to over 70%), with writing, information seeking, and practical guidance being the most common use cases.</span>
          </div>

          {optionalReadingDetailsOpen && (
            <div className="optional-abstract-section">
              <div className="optional-abstract-label">Abstract</div>
              <div className="optional-abstract-text">
                Despite the rapid adoption of LLM chatbots, little is known about how they are used. We document the growth of ChatGPT&apos;s consumer product from its launch in November 2022 through July 2025, when it had been adopted by around 10% of the world&apos;s adult population. Early adopters were disproportionately male but the gender gap has narrowed dramatically, and we find higher growth rates in lower-income countries. Using a privacy-preserving automated pipeline, we classify usage patterns within a representative sample of ChatGPT conversations. We find steady growth in work-related messages but even faster growth in non-work-related messages, which have grown from 53% to more than 70% of all usage. Work usage is more common for educated users in highly-paid professional occupations. We classify messages by conversation topic and find that &quot;Practical Guidance,&quot; &quot;Seeking Information,&quot; and &quot;Writing&quot; are the three most common topics and collectively account for nearly 80% of all conversations. Writing dominates work-related tasks, highlighting chatbots&apos; unique ability to generate digital outputs compared to traditional search engines. Computer programming and self-expression both represent relatively small shares of use. Overall, we find that ChatGPT provides economic value through decision support, which is especially important in knowledge-intensive jobs.
              </div>
            </div>
          )}
        </div>
        
        <h3>Week 3: Oct 8 - LLMs and role play</h3>
        {loadingPapers ? (
          <div style={{ padding: '1rem', color: '#666', fontStyle: 'italic' }}>Loading papers...</div>
        ) : (
          <div>
            {getPapersForWeek('3').map(paper => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
            <PersonalizedPaper weekNumber="3" />
          </div>
        )}

        <h3>Week 4: Oct 15 - Social Bots</h3>
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '6px', padding: '0.75rem', margin: '1rem 0', fontSize: '0.9rem' }}>
          <strong>📝 Assignment Due:</strong> <span className="deadline-link" onClick={() => scrollToSection('Proposals')} style={{ color: '#d97706', cursor: 'pointer', textDecoration: 'underline' }}>1-Page Proposal Due</span>
        </div>
        {loadingPapers ? (
          <div style={{ padding: '1rem', color: '#666', fontStyle: 'italic' }}>Loading papers...</div>
        ) : (
          <div>
            {getPapersForWeek('4').map(paper => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
            <PersonalizedPaper weekNumber="4" />
          </div>
        )}

        <h3>Week 5: Oct 22 - Models interacting with each other</h3>
        <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
          👥 <span className="deadline-link" onClick={() => scrollToSection('Draft Paper')} style={{ color: '#1d4ed8', cursor: 'pointer', textDecoration: 'underline' }}>Work on draft with partner in class</span>
        </p>
        {loadingPapers ? (
          <div style={{ padding: '1rem', color: '#666', fontStyle: 'italic' }}>Loading papers...</div>
        ) : (
          <div>
            {getPapersForWeek('5').map(paper => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
            <PersonalizedPaper weekNumber="5" />
            <div style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', padding: '1rem', margin: '1rem 0' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>📚 Additional Reading</div>
              <div style={{ fontStyle: 'italic', color: '#6b7280' }}>Everyone read: Darryl Bem&apos;s &quot;How to Write an Empirical Article&quot; (starting page 11)</div>
            </div>
          </div>
        )}
        
        <h3>Week 6: Oct 29 - Deception and Truth</h3>
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '6px', padding: '0.75rem', margin: '1rem 0', fontSize: '0.9rem' }}>
          <strong>📝 Assignment Due:</strong> <span className="deadline-link" onClick={() => scrollToSection('Draft Paper')} style={{ color: '#d97706', cursor: 'pointer', textDecoration: 'underline' }}>Revised Draft Paper Due</span>
        </div>
        {loadingPapers ? (
          <div style={{ padding: '1rem', color: '#666', fontStyle: 'italic' }}>Loading papers...</div>
        ) : (
          <div>
            {getPapersForWeek('6').map(paper => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
            <PersonalizedPaper weekNumber="6" />
          </div>
        )}

        <h3>Week 7: Nov 5 - LLMs reflecting human diversity of thought and opinion</h3>
        {loadingPapers ? (
          <div style={{ padding: '1rem', color: '#666', fontStyle: 'italic' }}>Loading papers...</div>
        ) : (
          <div>
            {getPapersForWeek('7').map(paper => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
            <PersonalizedPaper weekNumber="7" />
          </div>
        )}
        
        <h3>Week 8: Nov 12 - LLMs as (amazing) content analysts</h3>
        {loadingPapers ? (
          <div style={{ padding: '1rem', color: '#666', fontStyle: 'italic' }}>Loading papers...</div>
        ) : (
          <div>
            {getPapersForWeek('8').map(paper => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
            <PersonalizedPaper weekNumber="8" />
          </div>
        )}

        <h3>Week 9: Nov 19 - Reflections on human cognition</h3>
        {loadingPapers ? (
          <div style={{ padding: '1rem', color: '#666', fontStyle: 'italic' }}>Loading papers...</div>
        ) : (
          <div>
            {getPapersForWeek('9').map(paper => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
            <PersonalizedPaper weekNumber="9" />
            <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
              🎧 <a href="https://www.youtube.com/watch?v=UzgU4xAiTsM" target="_blank" rel="noopener noreferrer" style={{ color: '#000', textDecoration: 'none', borderBottom: '1px solid #f97316' }}>[YouTube Link]</a> Metaphors for LLMs (~20 minute audio presentation)
            </p>
          </div>
        )}

        <h3>Week 10: Dec 3 - Final project presentations</h3>
        <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
          <strong>Final Presentations:</strong> <span className="deadline-link" onClick={() => scrollToSection('Presentations')} style={{ color: '#d97706', cursor: 'pointer', textDecoration: 'underline' }}>Final Project Presentations (5-8 minutes)</span>
        </p>
        
        <p><strong><span className="brush-underline deadline-link" onClick={() => scrollToSection('Final Paper')}>Final Paper Due: December 13</span></strong></p>

        <h2>Course Policies</h2>
        
        <h3>Late Assignments</h3>
        <p>
          Students may submit one of their papers up to 24 hours late during the course of the quarter. This can be for any or no reason. Beyond this one, late assignments without prior arrangements or notification will penalized by 10% per day late. If you anticipate not being able to turn an assignment in on time, you should contact the instructor as early as possible. Extensions are at the instructor&apos;s discretion.
        </p>
        
        <h3>Attendance</h3>
        <p>
          Regular attendance is mandatory for this course, as there will be substantial time devoted to discussion, exercises and project work in class. Repeated failure to attend class could result in your course grade being lowered, or your dismissal from the course, at the instructor&apos;s discretion.
        </p>

        <h3>Use of Generative AI</h3>
        <p>
          Our primary principle will be disclosure of any use. You will likely often be using AI in your work in this class, but you always need to disclose use, your prompts and your editing process if any. As long as you disclose, all will be well.
        </p>

        <h3>Students with Disabilities</h3>
        <p>
          Students with disabilities that need accommodations in this class are encouraged to contact the Office of Accessible Education (OED) as soon as possible (i.e., during the first week of classes, barring extenuating circumstances that prohibit this) to ensure that such accommodations are implemented in a timely fashion. In general and to ensure fairness to all students, the instructors will not make accommodations for disabilities without documentation from the OED office.
        </p>

        <h3>Academic Integrity at Stanford University</h3>
        <p>
          Students are expected to comply with University regulations regarding academic integrity. If you are in doubt about what constitutes academic dishonesty, speak to the instructors before the assignment is due and/or examine the University web site. Academic dishonesty includes, but is not limited to cheating on an exam (e.g., copying others&apos; answers, providing information to others, using a crib sheet) or plagiarism of a paper (e.g., taking material from readings without citation, copying another student&apos;s paper). Failure to maintain academic integrity on an assignment will result in a loss of credit for that assignment—at a minimum. Other penalties may also apply, including academic suspension. The guidelines for determining academic dishonesty and procedures followed in a suspected incident of academic dishonesty are detailed on the website.
        </p>
        <p>
          For more information, visit:<br />
          <a href="https://web.stanford.edu/dept/lc/language/courses/academicIntegrity.html">https://web.stanford.edu/dept/lc/language/courses/academicIntegrity.html</a>
        </p>

        <h3>Sexual Harassment Policy</h3>
        <p>
          Stanford University strives to provide a place of work and study free of sexual harassment, intimidation or exploitation. Where sexual harassment has occurred, the University will act to stop the harassment, prevent its recurrence, and discipline and/or take other appropriate action against those responsible.: Sexual Harassment Policy Office website.
        </p>
        <p>
          For more information, visit: <a href="http://www.northwestern.edu/sexual-harassment/policy/index.html">http://www.northwestern.edu/sexual-harassment/policy/index.html</a>
        </p>
      </div>

    </div>
  );
}