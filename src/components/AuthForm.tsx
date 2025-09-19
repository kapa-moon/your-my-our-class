'use client';

import { useState } from 'react';

interface User {
  id: number;
  name: string;
  isGuest: boolean;
  sessionId?: string;
}

interface AuthFormProps {
  onAuth: (user: User) => void;
}

export default function AuthForm({ onAuth }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });

      const result = await response.json();

      if (result.success) {
        onAuth(result.user);
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        onAuth(result.user);
      } else {
        setError(result.error || 'Failed to continue as guest');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="max-w-2xl w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-light text-gray-900 dark:text-white">
            {isLogin ? 'COMM 324: Language and Technology' : 'Join us!'}
          </h2>
        </div>

        <div className="flex justify-center">
          <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm">
            <div>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-md transition-colors"
            >
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
        </div>

        <div className="text-center space-y-4">
          {/* <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button> */}

          {/* <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
            <button
              onClick={handleGuestLogin}
              disabled={loading}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm underline"
            >
              Continue as guest
            </button>
          </div> */}
        </div>

        {/* Desktop optimization footnote */}
        <div className="text-center mt-8">
          <p className="text-xs" style={{ color: '#654321' }}>
            This web app is optimized for <strong>desktop</strong> view.
          </p>
        </div>
      </div>
    </div>
  );
}
