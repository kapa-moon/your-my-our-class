'use client';

import { useState, useEffect } from 'react';
import AuthForm from '@/components/AuthForm';
import { storeUser, getStoredUser, clearStoredUser } from '@/lib/auth-utils';

interface User {
  id: number;
  name: string;
  isGuest: boolean;
  sessionId?: string;
}


export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [preferredName, setPreferredName] = useState<string | null>(null);
  const [hasCompletedSurvey, setHasCompletedSurvey] = useState<boolean>(false);

  // Check for stored user on component mount
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      fetchPreferredName(storedUser.id);
      checkSurveyStatus(storedUser.id);
    }
  }, []);

  // Fetch preferred name from persona card
  const fetchPreferredName = async (userId: number) => {
    try {
      const response = await fetch(`/api/persona?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.name) {
          setPreferredName(data.data.name);
        }
      }
    } catch {
      console.log('Could not fetch persona card, using default name');
      // Silently fail - we'll use the default name
    }
  };

  // Check if user has completed survey
  const checkSurveyStatus = async (userId: number) => {
    try {
      const response = await fetch(`/api/survey?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setHasCompletedSurvey(data.success && data.data);
      }
    } catch {
      console.log('Could not fetch survey status');
      setHasCompletedSurvey(false);
    }
  };

  const handleAuth = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    storeUser(authenticatedUser); // Store in localStorage
    fetchPreferredName(authenticatedUser.id); // Fetch preferred name
    checkSurveyStatus(authenticatedUser.id); // Check survey status
  };

  const handleLogout = () => {
    setUser(null);
    setPreferredName(null); // Clear preferred name
    clearStoredUser(); // Clear from localStorage
  };

  if (!user) {
    return <AuthForm onAuth={handleAuth} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black p-8">
      <div className="text-center space-y-6">
        
        
        <h1 className="text-4xl font-light text-gray-900 dark:text-white">
          Hello, <span className="font-medium">{preferredName || user.name}</span>
          {user.isGuest && (
            <span className="text-sm block mt-1 text-gray-500">
              (Guest session - not persisted across sessions)
            </span>
          )}
        </h1>

        <div className="text-lg text-gray-600 dark:text-gray-400 mb-12">
          Welcome to the Fall 2025 COMM 324 Hub!
        </div>

        {/* Navigation Links */}
        <div className="flex items-center justify-center space-x-8 text-lg mb-16">
          {hasCompletedSurvey ? (
            <span className="relative group transition-all duration-300 text-gray-400 cursor-not-allowed">
              <span className="relative z-10">Onboarding</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-400 opacity-30"></span>
              <span className="absolute inset-0 bg-gray-200 dark:bg-gray-800 opacity-0 group-hover:opacity-20 transition-opacity duration-300 transform -skew-x-12"></span>
            </span>
          ) : (
            <a
              href="/onboarding-ground"
              className="relative group transition-all duration-300 text-black dark:text-white hover:text-black dark:hover:text-white"
            >
              <span className="relative z-10">Onboarding</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500"></span>
              <span className="absolute inset-0 bg-orange-200 dark:bg-orange-800 opacity-0 group-hover:opacity-30 transition-opacity duration-300 transform -skew-x-12"></span>
            </a>
          )}

          <span className="text-gray-300">|</span>

          <a
            href="/my-persona-card"
            className="relative group text-black dark:text-white hover:text-black dark:hover:text-white transition-all duration-300"
          >
            <span className="relative z-10">My Persona Card</span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500"></span>
            <span className="absolute inset-0 bg-orange-200 dark:bg-orange-800 opacity-0 group-hover:opacity-30 transition-opacity duration-300 transform -skew-x-12"></span>
          </a>

          <span className="text-gray-300">|</span>

          <a
            href="/syllabus"
            className="relative group text-black dark:text-white hover:text-black dark:hover:text-white transition-all duration-300"
          >
            <span className="relative z-10">My Syllabus</span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500"></span>
            <span className="absolute inset-0 bg-orange-200 dark:bg-orange-800 opacity-0 group-hover:opacity-30 transition-opacity duration-300 transform -skew-x-12"></span>
          </a>

          <span className="text-gray-300">|</span>

          <a
            href="/the-square"
            className="relative group text-black dark:text-white hover:text-black dark:hover:text-white transition-all duration-300"
          >
            <span className="relative z-10">The Square</span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500"></span>
            <span className="absolute inset-0 bg-orange-200 dark:bg-orange-800 opacity-0 group-hover:opacity-30 transition-opacity duration-300 transform -skew-x-12"></span>
          </a>

          <span className="text-gray-300">|</span>

          <a
            href="/personal-playground"
            className="relative group text-black dark:text-white hover:text-black dark:hover:text-white transition-all duration-300"
          >
            <span className="relative z-10">Playground <span className="text-gray-500 text-sm">(Private View)</span></span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500"></span>
            <span className="absolute inset-0 bg-orange-200 dark:bg-orange-800 opacity-0 group-hover:opacity-30 transition-opacity duration-300 transform -skew-x-12"></span>
          </a>

          <span className="text-gray-300">|</span>

          <span className="text-gray-400 dark:text-gray-500">More features to come...</span>
        </div>

        {/* Tip Box for Onboarding */}
        {!hasCompletedSurvey && (
          <div className="relative max-w-md mx-auto mb-8">
            <div className="bg-white border border-black py-2 px-6 relative text-black" style={{fontFamily: 'var(--font-patrick-hand)'}}>
              <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full" style={{backgroundColor: '#ff305d'}}></div>
              <p className="text-sm leading-relaxed">
                It takes about 30 minutes to finish the onboarding process. If you start, we recommend you finish it in one session. It is very important and helpful for us to together try this new, experimental, and hopefully fun class experience!
              </p>
            </div>
          </div>
        )}

        {/* Sign out button */}
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline transition-colors"
        >
          {user.isGuest ? 'End session' : 'Sign out'}
        </button>
      </div>
    </div>
  );
}
