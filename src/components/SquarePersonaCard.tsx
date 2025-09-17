'use client';

import React from 'react';
import SimpleColorableAvatar from './SimpleColorableAvatar';

interface SubBulletPoint {
  id: string;
  content: string;
  isChecked?: boolean;
  isConfirmed?: boolean;
}

interface SquarePersonaCardProps {
  user: {
    userId: number;
    userName: string;
    persona: {
      name: string;
      affiliation: string;
      academicBackground: string | null;
      researchInterest: string | null;
      recentReading: string | null;
      learningGoal: string | null;
      avatarColor: string;
      introMessage: string | null;
      // Sub-bullets for show more section
      academicBackgroundSubBullets: SubBulletPoint[];
      researchInterestSubBullets: SubBulletPoint[];
      recentReadingSubBullets: SubBulletPoint[];
      learningGoalSubBullets: SubBulletPoint[];
    };
    position: {
      x: number | null;
      y: number | null;
      rotation: number;
      zIndex: number;
    };
  };
  style?: React.CSSProperties;
  onShowMore?: (user: any) => void;
}

const SquarePersonaCard: React.FC<SquarePersonaCardProps> = ({ user, style, onShowMore }) => {
  const { persona, position } = user;

  // Create the card style with fixed dimensions
  const cardStyle: React.CSSProperties = {
    width: '364px', // 1.3 times of 280px
    height: '220px', // Reduced height to fit content better
    backgroundColor: '#fdf7f2',
    border: '1px solid black',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '4px 4px 12px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    ...style,
  };

  return (
    <div 
      className="hover:scale-105 transition-transform duration-200 cursor-pointer"
      style={cardStyle}
      onClick={() => onShowMore && onShowMore(user)}
    >
      {/* Header with Avatar and Name */}
      <div className="flex items-start space-x-3 mb-3">
        <div className="flex-shrink-0">
          <SimpleColorableAvatar
            color={persona.avatarColor}
            size={50}
          />
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="text-lg font-bold text-black mb-1 truncate">
            {persona.name}
          </h3>
          <div className="text-sm text-gray-600 leading-tight max-h-12 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
            {persona.affiliation}
          </div>
        </div>
      </div>

      {/* Research Interest */}
      {persona.researchInterest && (
        <div className="mb-2 flex-shrink-0">
          <div className="text-xs text-gray-800 leading-tight max-h-12 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
            <span className="font-semibold">Research:</span> {' '}
            {persona.researchInterest}
          </div>
        </div>
      )}

      {/* Show More Button */}
      <div className="mt-2 pt-2 border-t border-gray-300 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent double-click when clicking the button directly
            onShowMore && onShowMore(user);
          }}
          className="text-sm text-black underline decoration-orange-500 decoration-2 hover:decoration-orange-600 transition-colors focus:outline-none"
        >
          show more
        </button>
      </div>
    </div>
  );
};

export default SquarePersonaCard;
