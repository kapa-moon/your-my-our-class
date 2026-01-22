'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SimpleColorableAvatar from '@/components/SimpleColorableAvatar';
import { getCurrentUserId } from '@/lib/auth-utils';

interface Classmate {
  id: number;
  userId: number;
  name: string;
  userName: string;
  affiliation: string;
  avatarColor: string;
  academicBackground: string | null;
  researchInterest: string | null;
  recentReading: string | null;
  learningGoal: string | null;
  discussionStyle: string | null;
  background: string | null;
  guidingQuestion: string | null;
  learningGoals: string | null;
  recentInterests: string | null;
  projectType: string | null;
  projectDescription: string | null;
}

interface SelectedAgent {
  id: number;
  userId: number;
  name: string;
  avatarColor: string;
}

export default function PersonalPlaygroundPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'entry' | 'manual-select'>('entry');
  const [selectedAgents, setSelectedAgents] = useState<SelectedAgent[]>([]);
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [loading, setLoading] = useState(true);
  const [userGoal, setUserGoal] = useState('');
  const [aiOrganizing, setAiOrganizing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Get current user ID
  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
  }, []);

  // Fetch classmates from the database
  useEffect(() => {
    async function fetchClassmates() {
      try {
        setLoading(true);
        const response = await fetch('/api/persona-playground/classmates');
        const data = await response.json();
        
        if (data.success) {
          setClassmates(data.classmates);
        } else {
          console.error('Failed to fetch classmates:', data.error);
        }
      } catch (error) {
        console.error('Error fetching classmates:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClassmates();
  }, []);

  const handleAgentSelect = (agent: Classmate) => {
    const isSelected = selectedAgents.some(a => a.userId === agent.userId);
    
    if (isSelected) {
      setSelectedAgents(selectedAgents.filter(a => a.userId !== agent.userId));
    } else if (selectedAgents.length < 4) {
      setSelectedAgents([...selectedAgents, {
        id: agent.id,
        userId: agent.userId,
        name: agent.name,
        avatarColor: agent.avatarColor
      }]);
    }
  };

  // Create conversation and redirect to it
  const createConversation = async (type: 'dm' | 'group', agents: SelectedAgent[], goal?: string, reasoning?: string) => {
    try {
      const response = await fetch('/api/persona-playground/conversation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          conversationType: type,
          userGoal: goal || null,
          matchingReasoning: reasoning || null,
          participatingAgents: agents.map(a => a.userId),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to the conversation page
        router.push(`/persona-playground/${data.conversation.id}`);
      } else {
        console.error('Failed to create conversation:', data.error);
        alert('Failed to start conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Error starting conversation. Please try again.');
    }
  };

  // Handle AI organize
  const handleAiOrganize = async () => {
    setAiOrganizing(true);
    try {
      // Call AI API to select appropriate classmates
      const response = await fetch('/api/persona-playground/match-classmates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          userGoal: userGoal.trim() || null,
          classmates: classmates.map(c => ({
            id: c.id,
            userId: c.userId,
            name: c.name,
            affiliation: c.affiliation,
            academicBackground: c.academicBackground,
            researchInterest: c.researchInterest,
            learningGoal: c.learningGoal,
            discussionStyle: c.discussionStyle,
            projectType: c.projectType,
          })),
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to match classmates');
      }

      // Get the selected classmates based on IDs returned by AI
      const selected = classmates.filter(c => data.selectedIds.includes(c.id));
      
      if (selected.length === 0) {
        throw new Error('No valid classmates selected');
      }

      const selectedAgentsList = selected.map(c => ({
        id: c.id,
        userId: c.userId,
        name: c.name,
        avatarColor: c.avatarColor
      }));
      
      // Create conversation with AI-generated reasoning
      await createConversation('group', selectedAgentsList, userGoal.trim() || undefined, data.reasoning);
    } catch (error) {
      console.error('Error organizing chat:', error);
      alert('Failed to organize chat. Please try again or select manually.');
    } finally {
      setAiOrganizing(false);
    }
  };

  // Manual chat type selection
  const handleChatTypeSelect = async (type: 'dm' | 'group') => {
    const agentsForChat = type === 'dm' ? [selectedAgents[0]] : selectedAgents;
    await createConversation(type, agentsForChat);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="border-b border-black">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-normal">
                Playground <span className="text-gray-500 text-lg">(Private View)</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {currentStep !== 'entry' && (
                <button
                  onClick={() => setCurrentStep('entry')}
                  className="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors rounded-md"
                >
                  ← Back
                </button>
              )}
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

      <div className="max-w-7xl mx-auto p-6">
        {/* Entry Screen */}
        {currentStep === 'entry' && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2">Welcome to the Playground!</h2>
              <p className="text-gray-600">Choose how you'd like to start your conversation</p>
            </div>

            <div className="space-y-6">
              {/* Option 1: AI Organize */}
              <div className="border border-gray-300 rounded-lg p-6 hover:border-orange-500 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Automatic grouping</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Tell a bit about what you're looking for, and you will be matched with 3-4 classmates!
                    </p>
                    
                    <div className="space-y-3">
                      <textarea
                        value={userGoal}
                        onChange={(e) => setUserGoal(e.target.value)}
                        placeholder="e.g., Talk about my project idea, discuss this week's readings, bounce off ideas for my paper, get feedback on my research..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 resize-none"
                        rows={3}
                      />
                      <button
                        onClick={handleAiOrganize}
                        disabled={aiOrganizing || loading}
                        className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {aiOrganizing ? 'Organizing chat...' : 'Start group chat'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Option 2: Manual Select */}
              <div className="border border-gray-300 rounded-lg p-6 hover:border-orange-500 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">I will manually choose my chat buddies</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Browse the list of classmates and select who you'd like to chat with (DM or group chat).
                    </p>
                    
                    <button
                      onClick={() => setCurrentStep('manual-select')}
                      disabled={loading}
                      className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Choose classmates manually
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Selection Screen */}
        {currentStep === 'manual-select' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Agent Selection Sidebar */}
            <div className="col-span-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-4">Choose classmates to chat with</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Select up to 4 
                </p>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Loading classmates...</div>
                  </div>
                ) : classmates.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">No classmates available</div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 overflow-y-auto" style={{ maxHeight: '400px' }}>
                    {classmates.map((classmate) => (
                      <div
                        key={classmate.userId}
                        className={`flex items-center py-3 px-2 cursor-pointer transition-colors ${
                          selectedAgents.some(a => a.userId === classmate.userId)
                            ? 'bg-orange-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleAgentSelect(classmate)}
                      >
                        <div className="mr-3 flex-shrink-0">
                          <SimpleColorableAvatar color={classmate.avatarColor} size={32} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-black">{classmate.name}</div>
                          <div className="text-xs text-gray-600">{classmate.affiliation}</div>
                        </div>
                        {selectedAgents.some(a => a.userId === classmate.userId) && (
                          <div className="text-orange-500 flex-shrink-0">✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected agents summary */}
                {selectedAgents.length > 0 && (
                  <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium text-sm mb-2">Selected ({selectedAgents.length}/4):</div>
                    <div className="space-y-1">
                      {selectedAgents.map((agent) => (
                        <div key={agent.userId} className="text-xs text-gray-600">
                          • {agent.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat type selection */}
                {selectedAgents.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="font-medium">Choose Chat Type:</h3>
                    <button
                      onClick={() => handleChatTypeSelect('dm')}
                      className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                      disabled={selectedAgents.length === 0}
                    >
                      <div className="font-medium">💬 Direct Message</div>
                      <div className="text-xs text-gray-500">
                        {selectedAgents.length > 0 ? `Chat with ${selectedAgents[0].name}` : 'Select an agent first'}
                      </div>
                    </button>
                    <button
                      onClick={() => handleChatTypeSelect('group')}
                      className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                      disabled={selectedAgents.length < 2}
                    >
                      <div className="font-medium">👥 Group Chat</div>
                      <div className="text-xs text-gray-500">
                        {selectedAgents.length >= 2 
                          ? `Group chat with ${selectedAgents.length} agents` 
                          : 'Select at least 2 agents'}
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="col-span-8">
              <div className="flex items-center justify-center h-96 text-center">
                <div>
                  <div className="text-4xl mb-4">👋</div>
                  <h2 className="text-xl text-gray-600 mb-2">Welcome to the Playground!</h2>
                  <p className="text-gray-500 mb-4">
                    Select classmates from the list to start a conversation.
                  </p>
                  <div className="text-sm text-gray-400">
                    You can choose up to 4 classmates for a group chat, or select 1 for a direct message.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
