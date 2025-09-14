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

  // Check for stored user on component mount
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const handleAuth = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    storeUser(authenticatedUser); // Store in localStorage
  };

  const handleLogout = () => {
    setUser(null);
    clearStoredUser(); // Clear from localStorage
  };

  if (!user) {
    return <AuthForm onAuth={handleAuth} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black p-8">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-light text-gray-900 dark:text-white">
          Hello you!
        </h1>
        
        <div className="text-lg text-gray-600 dark:text-gray-400">
          Welcome, <span className="font-medium">{user.name}</span>
          {user.isGuest && (
            <span className="text-sm block mt-1 text-gray-500">
              (Guest session - not persisted across sessions)
            </span>
          )}
        </div>

        <div className="flex flex-col items-center space-y-4">
          <a
            href="/onboarding-ground"
            className="px-6 py-3 bg-gray-800 dark:bg-gray-200 text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors rounded-md"
          >
            Onboarding Ground
          </a>
          
          <a
            href="/my-persona-card"
            className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors rounded-md"
          >
            My Persona Card
          </a>
          
          <a
            href="/semantic-scholar-demo"
            className="px-6 py-3 border border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200 hover:bg-gray-800 hover:text-white dark:hover:bg-gray-200 dark:hover:text-black transition-colors rounded-md"
          >
            Try Semantic Scholar Demo
          </a>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
          >
            {user.isGuest ? 'End session' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  );
}
