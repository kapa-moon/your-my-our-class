'use client';

import { useState } from 'react';

interface MindmapNode {
  topic: string;
  children?: MindmapNode[];
}

interface MindmapData {
  root: string;
  children: MindmapNode[];
}

interface MindmapTreeProps {
  mindmapData: string; // JSON string
}

function TreeNode({ node, level }: { node: MindmapNode; level: number }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  // Different styles for different levels
  const getLevelStyles = () => {
    switch (level) {
      case 0:
        return 'text-base font-semibold text-gray-900';
      case 1:
        return 'text-sm font-medium text-gray-800';
      case 2:
        return 'text-sm text-gray-700';
      default:
        return 'text-sm text-gray-600';
    }
  };

  return (
    <div className="mb-2">
      <div className="flex items-start">
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mr-2 mt-1 text-gray-500 hover:text-gray-700 focus:outline-none flex-shrink-0"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        {!hasChildren && <div className="w-4 mr-2 flex-shrink-0" />}
        <div className={`flex-1 ${getLevelStyles()} cursor-default`}>
          <div className="break-words">{node.topic}</div>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-6 mt-2 space-y-2 border-l-2 border-gray-200 pl-3">
          {node.children?.map((child, idx) => (
            <TreeNode key={idx} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MindmapTree({ mindmapData }: MindmapTreeProps) {
  let parsedData: MindmapData | null = null;

  try {
    if (mindmapData && mindmapData.trim()) {
      parsedData = JSON.parse(mindmapData);
    }
  } catch (error) {
    console.error('Failed to parse mindmap data:', error);
  }

  if (!parsedData || !parsedData.children || parsedData.children.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2 text-sm flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Conversation Map
        </h3>
        <div className="text-xs text-gray-500 italic">
          The conversation map will appear here after a few exchanges...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-[600px] overflow-y-auto">
      <h3 className="font-semibold mb-4 text-sm flex items-center sticky top-0 bg-white pb-2 border-b border-gray-200">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Conversation Map
      </h3>
      
      {/* Root node */}
      <div className="mb-4">
        <div className="font-bold text-gray-900">
          {parsedData.root}
        </div>
      </div>
      
      {/* Children nodes */}
      <div className="space-y-2">
        {parsedData.children.map((child, idx) => (
          <TreeNode key={idx} node={child} level={0} />
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 text-center">
        Auto-updates every few messages
      </div>
    </div>
  );
}










