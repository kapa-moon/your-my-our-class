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
}

const SquarePersonaCard: React.FC<SquarePersonaCardProps> = ({ user, style }) => {
  const { persona, position } = user;
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Create the card style with fixed dimensions
  const cardStyle: React.CSSProperties = {
    width: '364px', // 1.3 times of 280px
    height: '300px', // Fixed height
    backgroundColor: '#fdf7f2',
    border: '2px solid black',
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
      className="hover:scale-105 transition-transform duration-200"
      style={cardStyle}
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

      {/* Expandable Content */}
      {!isExpanded && (
        <div className="mt-auto pt-2 border-t border-gray-300 flex-shrink-0">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-sm text-black underline decoration-orange-500 decoration-2 hover:decoration-orange-600 transition-colors focus:outline-none"
          >
            show more
          </button>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-auto pt-2 border-t border-gray-300 flex-shrink-0 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          <div className="space-y-3">
            {/* Hi Message */}
            {persona.introMessage && (
              <div>
                <p className="text-xs text-gray-700 italic leading-tight">
                  💬 "{persona.introMessage}"
                </p>
              </div>
            )}

            {/* 🤔 Research Interest with sub-bullets */}
            {persona.researchInterest && (
              <div>
                <div className="flex items-start space-x-2 mb-1">
                  <span className="text-sm">🤔</span>
                  <p className="text-xs text-gray-700 leading-tight">
                    <span className="font-semibold">Research Interest:</span> {persona.researchInterest}
                  </p>
                </div>
                {persona.researchInterestSubBullets.length > 0 && (
                  <div className="ml-5 space-y-1">
                    {persona.researchInterestSubBullets
                      .filter(bullet => bullet.content && bullet.content.trim())
                      .map((bullet, index) => (
                        <div key={index} className="flex items-start space-x-1">
                          <span className="text-gray-400 text-xs mt-0.5">•</span>
                          <p className="text-xs text-gray-600 leading-tight">{bullet.content}</p>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            {/* 💭 Recent Reading/Thoughts with sub-bullets */}
            {persona.recentReading && (
              <div>
                <div className="flex items-start space-x-2 mb-1">
                  <span className="text-sm">💭</span>
                  <p className="text-xs text-gray-700 leading-tight">
                    <span className="font-semibold">Recent Reading/Thoughts:</span> {persona.recentReading}
                  </p>
                </div>
                {persona.recentReadingSubBullets.length > 0 && (
                  <div className="ml-5 space-y-1">
                    {persona.recentReadingSubBullets
                      .filter(bullet => bullet.content && bullet.content.trim())
                      .map((bullet, index) => (
                        <div key={index} className="flex items-start space-x-1">
                          <span className="text-gray-400 text-xs mt-0.5">•</span>
                          <p className="text-xs text-gray-600 leading-tight">{bullet.content}</p>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            {/* 🎯 Learning Goal with sub-bullets */}
            {persona.learningGoal && (
              <div>
                <div className="flex items-start space-x-2 mb-1">
                  <span className="text-sm">🎯</span>
                  <p className="text-xs text-gray-700 leading-tight">
                    <span className="font-semibold">Learning Goal:</span> {persona.learningGoal}
                  </p>
                </div>
                {persona.learningGoalSubBullets.length > 0 && (
                  <div className="ml-5 space-y-1">
                    {persona.learningGoalSubBullets
                      .filter(bullet => bullet.content && bullet.content.trim())
                      .map((bullet, index) => (
                        <div key={index} className="flex items-start space-x-1">
                          <span className="text-gray-400 text-xs mt-0.5">•</span>
                          <p className="text-xs text-gray-600 leading-tight">{bullet.content}</p>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setIsExpanded(false)}
              className="text-sm text-black underline decoration-orange-500 decoration-2 hover:decoration-orange-600 transition-colors focus:outline-none mt-2"
            >
              show less
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SquarePersonaCard;
