'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getCurrentUserId } from '@/lib/auth-utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function InterviewBot() {
  const [userId, setUserId] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      setUserId(currentUserId);
      checkExistingInterview(currentUserId);
    } else {
      setError('Please log in to access the interview bot');
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const checkExistingInterview = async (userIdParam: number) => {
    try {
      setIsInitializing(true);
      const response = await fetch(`/api/interview-bot?userId=${userIdParam}`);
      const data = await response.json();

      if (data.success && data.chatExists) {
        setChatHistory(data.data.chatHistory.filter((msg: any) => msg.role !== 'system'));
        setIsInterviewStarted(true);
        setIsInterviewCompleted(data.data.isCompleted);
      }
    } catch (err) {
      console.error('Error checking existing interview:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const startInterview = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/interview-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'start'
        })
      });

      const data = await response.json();

      if (data.success) {
        setChatHistory([{
          role: 'assistant',
          content: data.botResponse,
          timestamp: new Date().toISOString()
        }]);
        setIsInterviewStarted(true);
        setIsInterviewCompleted(false);
      } else {
        setError(data.error || 'Failed to start interview');
      }
    } catch (err) {
      setError('An error occurred while starting the interview');
      console.error('Error starting interview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userId || !currentMessage.trim() || isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/interview-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message: userMessage,
          action: 'send'
        })
      });

      const data = await response.json();

      if (data.success) {
        const botMessage: ChatMessage = {
          role: 'assistant',
          content: data.botResponse,
          timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, botMessage]);
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      setError('An error occurred while sending your message');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const completeInterview = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/interview-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'complete'
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsInterviewCompleted(true);
        const completionMessage: ChatMessage = {
          role: 'assistant',
          content: `Thank you for sharing! 🎉 Your interview has been completed and the insights will help enhance your persona card. You spent ${data.sessionDuration} minutes reflecting on your academic journey.`,
          timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, completionMessage]);
      } else {
        setError(data.error || 'Failed to complete interview');
      }
    } catch (err) {
      setError('An error occurred while completing the interview');
      console.error('Error completing interview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading interview...</div>
        </div>
      </div>
    );
  }

  if (error && !isInterviewStarted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-lg text-red-600">Error: {error}</div>
          <Link
            href="/onboarding-ground"
            className="inline-block px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            Back to Onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="border-b border-black">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-normal">Interview Bot</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {!isInterviewStarted ? (
          // Start Interview Screen
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-medium">Want to share more?</h2>
              <p className="text-gray-600">
                Try talking to a bot to elaborate on your responses and help us better understand your academic journey and interest.
              </p>
              <div className="pt-2">
                <button
                  onClick={startInterview}
                  disabled={isLoading}
                  className="relative group text-black hover:text-orange-600 transition-all duration-300 bg-transparent border-none p-0 cursor-pointer"
                >
                  <span className="relative z-10">
                    {isLoading ? 'Starting...' : '→ Start'}
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500"></span>
                  <span className="absolute inset-0 bg-orange-200 opacity-0 group-hover:opacity-30 transition-opacity duration-300 transform -skew-x-12"></span>
                </button>
              </div>
            </div>
            
            <div className="space-y-4 pt-4">
              <p className="text-gray-600">
                I think I am good. I already provided thorough answers to the survey.
              </p>
              <div>
                <Link
                  href="/my-persona-card"
                  className="relative group text-black hover:text-orange-600 transition-all duration-300"
                >
                  <span className="relative z-10">→ View My Persona Card</span>
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500"></span>
                  <span className="absolute inset-0 bg-orange-200 opacity-0 group-hover:opacity-30 transition-opacity duration-300 transform -skew-x-12"></span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // Chat Interface
          <div className="space-y-6">
            {/* Chat History */}
            <div 
              ref={chatContainerRef}
              className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50"
            >
              {chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-black text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse">Thinking...</div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            {!isInterviewCompleted && (
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <textarea
                    ref={inputRef}
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your response..."
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:border-black focus:outline-none disabled:bg-gray-100 resize-none overflow-hidden"
                    style={{
                      minHeight: '40px',
                      height: 'auto'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${Math.max(40, target.scrollHeight)}px`;
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !currentMessage.trim()}
                    className={`px-6 py-2 rounded-md font-medium transition-colors ${
                      isLoading || !currentMessage.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    Send
                  </button>
                </div>

                {/* Complete Interview Button */}
                <div className="text-center">
                  <button
                    onClick={completeInterview}
                    disabled={isLoading}
                    className={`px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors ${
                      isLoading ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                  >
                    That&apos;s enough - Complete Interview
                  </button>
                </div>
              </div>
            )}

            {/* Completion State */}
            {isInterviewCompleted && (
              <div className="flex justify-end">
                <Link
                  href="/my-persona-card"
                  className="relative group text-black hover:text-orange-600 transition-all duration-300"
                >
                  <span className="relative z-10">View My Persona Card →</span>
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500"></span>
                  <span className="absolute inset-0 bg-orange-200 opacity-0 group-hover:opacity-30 transition-opacity duration-300 transform -skew-x-12"></span>
                </Link>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
