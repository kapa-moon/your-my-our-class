'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SquarePersonaCard from '@/components/SquarePersonaCard';
import PersonaPopup from '@/components/PersonaPopup';
import { getCurrentUserId } from '@/lib/auth-utils';

interface SubBulletPoint {
  id: string;
  content: string;
  isChecked?: boolean;
  isConfirmed?: boolean;
}

interface SquareUser {
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
}

export default function TheSquarePage() {
  const [users, setUsers] = useState<SquareUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<SquareUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gridHeight, setGridHeight] = useState(1000);
  const [isTipBoxVisible, setIsTipBoxVisible] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
  }, []);

  useEffect(() => {
    fetchSquareData();
  }, []);

  const fetchSquareData = async () => {
    try {
      setLoading(true);
      
      // First, try to initialize positions for users who don't have them
      await fetch('/api/square', { method: 'POST' });
      
      // Then fetch all the square data
      const response = await fetch('/api/square');
      if (!response.ok) {
        throw new Error('Failed to fetch square data');
      }
      
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
        setGridHeight(data.gridHeight || 1000);
      } else {
        setError('Failed to load square data');
      }
    } catch (err) {
      console.error('Error fetching square data:', err);
      setError('Failed to load The Square');
    } finally {
      setLoading(false);
    }
  };

  const resetPositions = async () => {
    try {
      setLoading(true);
      
      // Reset all positions to grid layout
      const resetResponse = await fetch('/api/square/reset-positions', { method: 'POST' });
      if (!resetResponse.ok) {
        throw new Error('Failed to reset positions');
      }
      
      // Then fetch the updated data
      await fetchSquareData();
    } catch (err) {
      console.error('Error resetting positions:', err);
      setError('Failed to reset positions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black">
        {/* Header */}
        <div className="border-b border-black">
          <div className="w-full px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-normal">The Square</h1>
              <div className="flex items-center gap-4">
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

        {/* Loading State */}
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading The Square...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-black">
        {/* Header */}
        <div className="border-b border-black">
          <div className="w-full px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-normal">The Square</h1>
              <div className="flex items-center gap-4">
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

        {/* Error State */}
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchSquareData}
              className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors rounded-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="border-b border-black">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-normal">The Square</h1>
              <p className="text-sm text-gray-600 mt-1">
                {users.filter((user) => !['test1', 'student_test', 'pilot3', 'pilot1'].includes(user.userName)).length-2} classmates in the square
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* <button 
                onClick={resetPositions}
                className="px-3 py-1 text-sm border border-orange-300 text-orange-600 hover:bg-orange-100 transition-colors rounded-md"
              >
                🔄 Reset to Grid
              </button> */}
              <button 
                onClick={fetchSquareData}
                className="px-3 py-1 text-sm border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors rounded-md"
              >
                ↻ Refresh
              </button>
              <Link 
                href="/my-persona-card"
                className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors rounded-md"
              >
                My Persona Card
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

      {/* The Square - Grid Layout Persona Cards */}
      <div className="relative w-full" style={{ minHeight: `calc(100vh - 80px)`, backgroundColor: '#fafafa' }}>
        {users.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-xl text-gray-600 mb-4">
                The Square is Empty
              </h2>
              <p className="text-gray-500">
                No classmates have created their persona cards yet.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Background Pattern */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            
            {/* Simple CSS Grid Layout */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8 max-w-7xl mx-auto">
              {users
                .filter((user) => !['test1', 'student_test', 'pilot3', 'pilot1'].includes(user.userName))
                .map((user) => (
                  <SquarePersonaCard 
                    key={user.userId} 
                    user={user}
                    onShowMore={(selectedUser) => setSelectedUser(selectedUser)}
                  />
                ))}
            </div>
            
            {/* Tip Box */}
            {isTipBoxVisible && (
              <div className="absolute bottom-4 right-4 max-w-xs">
                <div className="bg-white border border-black py-4 px-5 relative text-black" style={{fontFamily: 'inherit'}}>
                  <button
                    onClick={() => setIsTipBoxVisible(false)}
                    className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                    style={{backgroundColor: '#ff305d'}}
                    title="Close tip box"
                    aria-label="Close tip box"
                  ></button>
                  <p className="text-sm leading-relaxed">
                    👋 Welcome to The Square! This is where all your classmates' persona cards are organized in a clean grid. 
                    Hover over cards to see them up close.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Persona Popup */}
      {selectedUser && (
        <PersonaPopup 
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          currentUserId={currentUserId || undefined}
        />
      )}
    </div>
  );
}
