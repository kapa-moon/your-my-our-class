'use client';

import React, { useState, useEffect } from 'react';
import SimpleColorableAvatar from './SimpleColorableAvatar';

interface SubBulletPoint {
  id: string;
  content: string;
  isChecked?: boolean;
  isConfirmed?: boolean;
}

interface Reaction {
  count: number;
  users: string[];
}

interface Comment {
  id: number;
  comment: string;
  aiReply: string | null;
  commenterUserId: number;
  commenterName: string;
  createdAt: string;
}

interface PersonaPopupProps {
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
  };
  onClose: () => void;
  currentUserId?: number;
}

const PersonaPopup: React.FC<PersonaPopupProps> = ({ user, onClose, currentUserId }) => {
  const { persona } = user;
  const [reactions, setReactions] = useState<{ [emoji: string]: Reaction }>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(true);

  // Popular emoji options for reactions
  const emojiOptions = ['👍', '❤️', '😊', '🤔', '🎯', '🔥', '👏', '💡', '🚀', '✨'];

  useEffect(() => {
    fetchInteractions();
  }, [user.userId]);

  const fetchInteractions = async () => {
    try {
      const response = await fetch(`/api/persona-interactions?personaUserId=${user.userId}`);
      if (response.ok) {
        const data = await response.json();
        setReactions(data.data.reactions);
        setComments(data.data.comments);
      }
    } catch (error) {
      console.error('Error fetching interactions:', error);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!currentUserId) return;

    try {
      const response = await fetch('/api/persona-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reaction',
          personaUserId: user.userId,
          userId: currentUserId,
          emoji: emoji,
        }),
      });

      if (response.ok) {
        await fetchInteractions(); // Refresh reactions
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleComment = async () => {
    if (!currentUserId || !newComment.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/persona-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'comment',
          personaUserId: user.userId,
          userId: currentUserId,
          comment: newComment.trim(),
        }),
      });

      if (response.ok) {
        setNewComment('');
        await fetchInteractions(); // Refresh comments
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Background overlay - clickable to close */}
      <div 
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
        onClick={onClose}
      />
      
      {/* Popup positioned on the right side */}
      <div className="fixed top-1/2 right-8 transform -translate-y-1/2 bg-white border-2 border-black rounded-lg shadow-2xl z-50 max-h-[80vh] overflow-hidden" style={{width: '538px'}}>
        {/* Header with close button */}
        <div className="relative bg-gray-50 px-6 py-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-4 h-4 bg-red-500 rounded-full hover:bg-red-600 transition-colors cursor-pointer"
            style={{backgroundColor: '#ff305d'}}
            title="Close"
            aria-label="Close popup"
          />
          
          {/* User info header */}
          <div className="flex items-start space-x-3 pr-8">
            <div className="flex-shrink-0">
              <SimpleColorableAvatar
                color={persona.avatarColor}
                size={50}
              />
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="text-lg font-bold text-black mb-1">
                {persona.name}
              </h3>
              <p className="text-sm text-gray-600">
                {persona.affiliation}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex flex-col h-[calc(80vh-120px)]">
          <div className="p-6 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-gray-300">
          <div className="space-y-6">
            {/* Hi Message */}
            {persona.introMessage && (
              <div>
                <p className="text-sm text-gray-700 italic leading-relaxed">
                  💬 "{persona.introMessage}"
                </p>
              </div>
            )}

            {/* 🤔 Research Interest with sub-bullets */}
            {persona.researchInterest && (
              <div>
                <div className="flex items-start space-x-3 mb-3">
                  <span className="text-lg">🤔</span>
                  <div className="flex-grow">
                    <p className="text-sm text-gray-800 leading-relaxed">
                      <span className="font-semibold">Research Interest:</span> {persona.researchInterest}
                    </p>
                  </div>
                </div>
                {persona.researchInterestSubBullets.length > 0 && (
                  <div className="ml-8 space-y-2">
                    {persona.researchInterestSubBullets
                      .filter(bullet => bullet.content && bullet.content.trim())
                      .map((bullet, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="text-gray-400 text-sm mt-1">•</span>
                          <p className="text-sm text-gray-700 leading-relaxed">{bullet.content}</p>
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
                <div className="flex items-start space-x-3 mb-3">
                  <span className="text-lg">💭</span>
                  <div className="flex-grow">
                    <p className="text-sm text-gray-800 leading-relaxed">
                      <span className="font-semibold">Recent Reading/Thoughts:</span> {persona.recentReading}
                    </p>
                  </div>
                </div>
                {persona.recentReadingSubBullets.length > 0 && (
                  <div className="ml-8 space-y-2">
                    {persona.recentReadingSubBullets
                      .filter(bullet => bullet.content && bullet.content.trim())
                      .map((bullet, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="text-gray-400 text-sm mt-1">•</span>
                          <p className="text-sm text-gray-700 leading-relaxed">{bullet.content}</p>
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
                <div className="flex items-start space-x-3 mb-3">
                  <span className="text-lg">🎯</span>
                  <div className="flex-grow">
                    <p className="text-sm text-gray-800 leading-relaxed">
                      <span className="font-semibold">Learning Goal:</span> {persona.learningGoal}
                    </p>
                  </div>
                </div>
                {persona.learningGoalSubBullets.length > 0 && (
                  <div className="ml-8 space-y-2">
                    {persona.learningGoalSubBullets
                      .filter(bullet => bullet.content && bullet.content.trim())
                      .map((bullet, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="text-gray-400 text-sm mt-1">•</span>
                          <p className="text-sm text-gray-700 leading-relaxed">{bullet.content}</p>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}
          </div>

          </div>
          
          {/* Fixed Interaction Section at Bottom */}
          <div className="border-t border-gray-200 p-6 bg-white flex-shrink-0">
            
            {/* Emoji Reactions */}
            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-2">Quick reactions:</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="flex items-center gap-1 px-2 py-1 text-sm border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                    disabled={!currentUserId}
                  >
                    <span>{emoji}</span>
                    {reactions[emoji] && (
                      <span className="text-xs text-gray-600">{reactions[emoji].count}</span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Show who reacted */}
              {Object.entries(reactions).length > 0 && (
                <div className="text-xs text-gray-500">
                  {Object.entries(reactions).map(([emoji, data]) => (
                    <span key={emoji} className="mr-2">
                      {emoji} {data.users.slice(0, 3).join(', ')}
                      {data.users.length > 3 && ` +${data.users.length - 3} more`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2 flex-grow">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Leave a comment..."
                    className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-black focus:outline-none"
                    disabled={!currentUserId || loading}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  />
                  <button
                    onClick={handleComment}
                    disabled={!currentUserId || !newComment.trim() || loading}
                    className="px-3 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-300"
                  >
                    {loading ? '...' : 'Post'}
                  </button>
                </div>
                {comments.length > 0 && (
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="ml-2 px-2 py-1 text-xs text-red-500 hover:text-red-600 transition-colors focus:outline-none"
                    title={showComments ? 'Hide comments' : 'Show comments'}
                  >
                    {showComments ? '▼' : '▶'}
                  </button>
                )}
              </div>

              {/* Comments List - Collapsible */}
              {showComments && (
                <div className="space-y-3 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                  {comments.map((comment) => (
                    <div key={comment.id} className="text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-gray-800">{comment.commenterName}:</span>
                        <span className="text-gray-700">{comment.comment}</span>
                      </div>
                      {comment.aiReply && (
                        <div className="ml-4 mt-1 p-2 bg-blue-50 rounded text-xs text-blue-800">
                          <span className="font-medium">{persona.name} (bot):</span> {comment.aiReply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!currentUserId && (
                <p className="text-xs text-gray-500 mt-2">Sign in to interact with personas</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PersonaPopup;
