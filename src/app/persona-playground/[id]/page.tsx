'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SimpleColorableAvatar from '@/components/SimpleColorableAvatar';
import MindmapTree from '@/components/MindmapTree';
import { getCurrentUserId } from '@/lib/auth-utils';

interface Utterance {
  id: number;
  speakerId: number | null;
  speakerType: string;
  speakerName: string;
  content: string;
  timestamp: string;
  sequenceNumber: number;
}

interface SelectedAgent {
  id: number;
  userId: number;
  name: string;
  avatarColor: string;
}

interface ConversationData {
  id: number;
  userId: number;
  conversationType: string;
  userGoal: string | null;
  isEnded: boolean;
  participatingAgents: SelectedAgent[];
  memoryPad: string;
  conversationMindmap: string;
  matchingReasoning?: string | null;
}

// Typing Indicator Component
const TypingIndicator = () => (
  <div className="flex space-x-1 items-center p-2 bg-gray-100 rounded-lg rounded-tl-none w-fit h-[36px]">
    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
  </div>
);

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = parseInt(params.id as string);
  
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [utterances, setUtterances] = useState<Utterance[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  
  // Goal editing state
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editedGoal, setEditedGoal] = useState('');
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  // Auto-reply state
  const [typingAgentId, setTypingAgentId] = useState<number | null>(null);
  const [isAutoReplying, setIsAutoReplying] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or typing starts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [utterances, typingAgentId]);

  // Get current user ID
  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
  }, []);

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/persona-playground/conversation/${conversationId}`);
      const data = await response.json();
      
      if (data.success) {
        setConversation(data.conversation);
        setUtterances(data.utterances);
      } else {
        setError(data.error || 'Failed to load conversation');
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get random integer between min and max (inclusive)
  const getRandomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Process auto-replies (mimic group chat)
  const processAutoReplies = async () => {
    if (isAutoReplying) return; // Prevent overlapping batches
    setIsAutoReplying(true);

    try {
        // 1. Get list of next speakers (randomly arranged)
        const modResponse = await fetch(`/api/persona-playground/conversation/${conversationId}/moderate`, {
            method: 'POST',
        });
        const modData = await modResponse.json();
        
        if (!modData.success || !modData.speakerQueue) {
            console.error('Failed to get auto-reply queue');
            setIsAutoReplying(false);
            return;
        }

        const queue = modData.speakerQueue; // Array of { userId, reasoning }
        console.log('Auto-reply queue:', queue);

        // 2. Iterate through queue
        for (const speaker of queue) {
            const agentId = speaker.userId;
            
            // Random delay before typing starts (mimic reading time)
            const readTime = getRandomInt(800, 2000);
            await new Promise(resolve => setTimeout(resolve, readTime));
            
            // Start typing
            setTypingAgentId(agentId);
            
            // Typing duration (mimic writing time) - varied since messages range 4-45 words
            const typeTime = getRandomInt(1500, 3500);
            await new Promise(resolve => setTimeout(resolve, typeTime));
            
            // Generate utterance
            try {
                const genResponse = await fetch(`/api/persona-playground/conversation/${conversationId}/generate-utterance`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ agentUserId: agentId }),
                });
                
                const genData = await genResponse.json();
                
                if (genData.success && genData.utterance) {
                    // Verify content is not empty
                    if (genData.utterance.content && genData.utterance.content.trim() !== '') {
                        setUtterances(prev => [...prev, genData.utterance]);
                    }
                }
            } catch (e) {
                console.error('Error generating utterance:', e);
            }
            
            // Stop typing
            setTypingAgentId(null);
        }

        // Refresh conversation (mindmap etc) - silent update
        const response = await fetch(`/api/persona-playground/conversation/${conversationId}`);
        const data = await response.json();
        if (data.success) {
             setConversation(data.conversation);
        }

    } catch (error) {
        console.error('Error in auto-reply flow:', error);
    } finally {
        setIsAutoReplying(false);
        setTypingAgentId(null);
    }
  };

  // Handle input change with @ detection
  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    // Show mention suggestions when @ is typed
    const lastChar = value.slice(-1);
    if (lastChar === '@') {
      setShowMentionSuggestions(true);
    } else if (!value.includes('@')) {
      setShowMentionSuggestions(false);
    }
  };

  // Insert mention
  const insertMention = (agentName: string) => {
    const firstName = agentName.split(' ')[0];
    const newText = newMessage.replace(/@\w*$/, `@${firstName} `);
    setNewMessage(newText);
    setShowMentionSuggestions(false);
  };

  // Send user message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setShowMentionSuggestions(false);
    
    try {
      const response = await fetch(`/api/persona-playground/conversation/${conversationId}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          content: messageContent,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Add user's message
        setUtterances(prev => [...prev, data.utterance]);
        
        // Handle immediate mention responses
        if (data.agentResponses && data.agentResponses.length > 0) {
          const validResponses = data.agentResponses.filter((response: any) => 
            response && response.content && response.content.trim() !== ''
          );
          if (validResponses.length > 0) {
            setUtterances(prev => [...prev, ...validResponses]);
          }
        }
        
        // Always trigger the random group chat flow
        processAutoReplies();
        
      } else {
        console.error('Failed to send message:', data.error);
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    }
  };

  // Start editing goal
  const handleStartEditGoal = () => {
    setEditedGoal(conversation?.userGoal || '');
    setIsEditingGoal(true);
  };

  // Cancel editing goal
  const handleCancelEditGoal = () => {
    setIsEditingGoal(false);
    setEditedGoal('');
  };

  // Save edited goal
  const handleSaveGoal = async () => {
    if (!conversation) return;
    
    setIsSavingGoal(true);
    try {
      const response = await fetch(`/api/persona-playground/conversation/${conversationId}/update-goal`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userGoal: editedGoal.trim() || null,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setConversation({
          ...conversation,
          userGoal: editedGoal.trim() || null,
        });
        setIsEditingGoal(false);
      } else {
        alert('Failed to update goal. Please try again.');
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Error updating goal. Please try again.');
    } finally {
      setIsSavingGoal(false);
    }
  };

  // End conversation
  const handleEndChat = async () => {
    if (!confirm('Are you sure you want to end this conversation?')) return;
    
    try {
      const response = await fetch(`/api/persona-playground/conversation/${conversationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        router.push('/persona-playground');
      } else {
        alert('Failed to end conversation');
      }
    } catch (error) {
      console.error('Error ending conversation:', error);
      alert('Error ending conversation');
    }
  };

  // Get agent info by userId
  const getAgentByUserId = (userId: number) => {
    return conversation?.participatingAgents.find(a => a.userId === userId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading conversation...</div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">{error || 'Conversation not found'}</div>
          <Link 
            href="/persona-playground"
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            ← Back to Playground
          </Link>
        </div>
      </div>
    );
  }

  if (conversation.isEnded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">This conversation has ended.</div>
          <Link 
            href="/persona-playground"
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            ← Start New Conversation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white text-black">
      {/* Header */}
      <div className="border-b border-black flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-normal">
                Playground <span className="text-gray-500 text-lg">(Private View)</span>
              </h1>
              <div className="text-sm text-gray-600 mt-1">
                {conversation.conversationType === 'dm' ? 'Direct Message with' : 'Group Chat with'}{' '}
                {conversation.participatingAgents.map(a => a.name).join(', ')}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleEndChat}
                className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-50 transition-colors rounded-md"
              >
                End Chat
              </button>
              <Link 
                href="/persona-playground"
                className="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors rounded-md"
              >
                ← Start Over
              </Link>
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

      <div className="flex-1 max-w-[1800px] w-full mx-auto p-6 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Left Sidebar - Chat Info Only */}
          <div className="col-span-3 space-y-4 overflow-y-auto h-full">
            {/* Participants */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-4">
                {conversation.conversationType === 'dm' ? 'Direct Message' : 'Group Chat'}
              </h3>
              <div className="space-y-3">
                {conversation.participatingAgents.map((agent) => (
                  <div key={agent.userId} className="flex items-center space-x-3">
                    <SimpleColorableAvatar color={agent.avatarColor} size={32} />
                    <div className="text-sm font-medium">{agent.name}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium mb-1">
                  Your Goal: <span className="text-xs text-gray-500 font-normal">(Double click to update)</span>
                </div>
                {isEditingGoal ? (
                  <div className="space-y-2">
                    <textarea
                      value={editedGoal}
                      onChange={(e) => setEditedGoal(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:border-blue-500 resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveGoal}
                        disabled={isSavingGoal}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        {isSavingGoal ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEditGoal}
                        disabled={isSavingGoal}
                        className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDoubleClick={handleStartEditGoal}
                    className="text-xs text-gray-600 cursor-pointer hover:bg-blue-100 p-1 rounded transition-colors"
                    title="Double-click to edit"
                  >
                    {conversation.userGoal || 'No specific goal set. Double-click to add one.'}
                  </div>
                )}
              </div>

              {conversation.matchingReasoning && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium mb-1">Why This Group:</div>
                  <div className="text-xs text-gray-600">{conversation.matchingReasoning}</div>
                </div>
              )}
            </div>
            
            {/* Speaker Queue UI Removed */}
          </div>

          {/* Chat Interface */}
          <div className="col-span-6 flex flex-col h-full min-h-0">
            {/* Messages Area - scrollable */}
            <div className="flex-1 overflow-y-auto bg-white rounded-lg p-4">
              <div className="space-y-4">
                {utterances.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    Conversation started. Say something to kick it off!
                  </div>
                )}
                
                {utterances.map((utterance) => (
                  <div key={utterance.id} className={`flex ${utterance.speakerType === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      utterance.speakerType === 'user' 
                        ? 'text-black bg-gray-50 border border-gray-100' 
                        : utterance.speakerType === 'system'
                        ? 'bg-gray-200 text-gray-600 text-xs italic'
                        : 'bg-gray-100 text-black'
                    }`}>
                      {utterance.speakerType === 'agent' && (
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-bold opacity-70">{utterance.speakerName}</span>
                        </div>
                      )}
                      <div className="text-sm">{utterance.content}</div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {typingAgentId && (() => {
                    const agent = getAgentByUserId(typingAgentId);
                    return (
                        <div className="flex justify-start">
                            <div className="flex flex-col">
                                {agent && (
                                    <div className="text-xs font-bold opacity-70 ml-1 mb-1">{agent.name}</div>
                                )}
                                <TypingIndicator />
                            </div>
                        </div>
                    );
                })()}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area - sticky at bottom */}
            <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 -mx-4 px-4 py-3 mt-4">
              {/* Mention suggestions dropdown */}
              {showMentionSuggestions && conversation.participatingAgents.length > 0 && (
                <div className="bg-white border border-gray-300 rounded-lg p-2 shadow-lg max-w-xs mb-2 absolute bottom-20">
                  <div className="text-xs text-gray-500 mb-1 px-2">Mention someone:</div>
                  <div className="space-y-1">
                    {conversation.participatingAgents.map((agent) => (
                      <button
                        key={agent.userId}
                        onClick={() => insertMention(agent.name)}
                        className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded flex items-center space-x-2 text-sm"
                      >
                        <SimpleColorableAvatar color={agent.avatarColor} size={20} />
                        <span>{agent.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2 mb-2 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message... (use @Name to tag)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black bg-white"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Mindmap - Right Sidebar */}
          <div className="col-span-3 overflow-y-auto h-full">
            <MindmapTree mindmapData={conversation.conversationMindmap || ''} />
          </div>
        </div>
      </div>
    </div>
  );
}
