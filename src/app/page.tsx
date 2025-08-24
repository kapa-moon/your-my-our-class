'use client';

import { useState } from 'react';
import AuthForm from '@/components/AuthForm';

interface User {
  id: number;
  name: string;
  isGuest: boolean;
  sessionId?: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  const handleAuth = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    setUser(null);
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

        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
        >
          {user.isGuest ? 'End session' : 'Sign out'}
        </button>
      </div>
    </div>
  );
}
