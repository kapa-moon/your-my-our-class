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
  const [isUserGuideOpen, setIsUserGuideOpen] = useState<boolean>(false);

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

  const openUserGuide = () => {
    setIsUserGuideOpen(true);
  };

  const closeUserGuide = () => {
    setIsUserGuideOpen(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeUserGuide();
    }
  };

  if (!user) {
    return <AuthForm onAuth={handleAuth} />;
  }

  return (
    <>
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black p-8 relative">
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

          <span className="relative group transition-all duration-300 text-gray-400 cursor-not-allowed">
            <span className="relative z-10">Playground <span className="text-gray-500 text-sm">(to come...)</span></span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-400 opacity-30"></span>
            <span className="absolute inset-0 bg-gray-200 dark:bg-gray-800 opacity-0 group-hover:opacity-20 transition-opacity duration-300 transform -skew-x-12"></span>
          </span>
        </div>

        {/* Tip Box for Onboarding */}
        {!hasCompletedSurvey && (
          <div className="relative max-w-md mx-auto mb-8">
            <div className="bg-white border border-black py-2 px-6 relative text-black" style={{fontFamily: 'var(--font-patrick-hand)'}}>
              <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full" style={{backgroundColor: '#ff305d'}}></div>
              <p className="text-sm leading-relaxed">
                It takes about 30 minutes to finish the onboarding process. If you start, we recommend you finish it in one session. It is very important and helpful for us to together try this new, experimental, and hopefully fun class experience!
              </p>
              <p className="text-sm leading-relaxed mt-2">
                Please check out the <button onClick={openUserGuide} className="font-bold text-black border-b-2 border-orange-500 hover:bg-orange-50 transition-colors">📝User Guide</button> if this is the first time you're using this platform.
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
      
      {/* Floating User Guide Button */}
      <button
        onClick={openUserGuide}
        className="fixed bottom-6 right-6 bg-white text-black px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 z-40"
      >
        📝User Guide
      </button>
    </div>

    {/* User Guide Modal */}
    {isUserGuideOpen && (
      <div 
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        onClick={handleOverlayClick}
      >
        <div className="bg-white w-3/4 h-3/5 rounded-lg shadow-xl relative overflow-hidden">
          {/* Close button - red dot */}
          <button
            onClick={closeUserGuide}
            className="absolute top-4 right-4 w-3 h-3 rounded-full z-10 flex items-center justify-center text-white text-xs font-bold"
            style={{backgroundColor: '#ff305d'}}
          >
            ×
          </button>
          
          {/* Modal content with scroll */}
          <div className="h-full overflow-y-auto p-6" style={{fontFamily: 'var(--font-atkinson-hyperlegible)'}}>
            <h2 className="text-2xl font-bold mb-6 text-black">📝 User Guide</h2>
            <div className="text-black space-y-6">
              
              {/* General Section */}
              <section>
                <h3 className="text-lg font-bold mb-3 text-black">General</h3>
                <ul className="space-y-2 text-base leading-relaxed">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>This is a <strong>living syllabus</strong>. The content may evolve (but will not deviate a lot) as we go into the quarter further. The space of language of technology, especially given the development of AI, is moving fast. For example, we might have new (and better) ideas of what to read about as we proceed.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>You are welcome to <strong>change your project ideas and proposal</strong> as it matures more.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>On top of that, we will have <strong>more features</strong> that will come in the next few weeks that we hope to help bring better learning experiences for you.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>This is an <strong>iterative process</strong> and your feedback is valuable at any time. Feel free to send messages or email us whenever you run into issues or simply have thoughts to share.</span>
                  </li>
                </ul>
              </section>

              {/* Persona Card Section */}
              <section>
                <h3 className="text-lg font-bold mb-3 text-black">Persona Card</h3>
                <ul className="space-y-2 text-base leading-relaxed">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>Think about how the content on this Card will <strong>"represent" you</strong> in a digital space that powers an LLM to talk to your classmates on your behalf (e.g., on <a href="#square-section" className="text-blue-600 underline">The Square</a>).</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>On this page, you can see <strong>two sides</strong>. One is a card view that contains AI-processed information. The other is the raw content that directly stores your survey answers. If you have something that the survey/interview bot didn't capture, you can always add it here.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>You can <strong>(re)generate</strong> your new Persona Card by clicking the button. You can double-click to edit information as needed. The Persona Card information will then show up in the public space called "The Square" where everyone can see it.</span>
                  </li>
                </ul>
              </section>

              {/* My Syllabus Section */}
              <section>
                <h3 className="text-lg font-bold mb-3 text-black">My Syllabus</h3>
                <ul className="space-y-2 text-base leading-relaxed">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>Two main sections that make this syllabus look different from the Google Doc version are <strong>1) Research Project</strong> and <strong>2) Weekly Readings</strong>. We will provide more details about the research project as we proceed with the class.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>If you scroll to the weekly schedule and readings section, you'll find that the AI has recommended <strong>personalized readings</strong> based on your survey answers. There are three options—please choose one to read during the assigned week.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>You can regenerate your syllabus by clicking the <span className="bg-white text-black border border-black px-2 py-1 rounded text-xs font-medium">(Re)generate</span> button. Sometimes if you see missing readings for that week, you can try regenerating by clicking the button. If you cannot get satisfactory content after <strong>two</strong> regenerations, please contact us (yueweny@stanford.edu)</span>
                  </li>
                </ul>
              </section>

              {/* The Square Section */}
              <section id="square-section">
                <h3 className="text-lg font-bold mb-3 text-black">The Square</h3>
                <ul className="space-y-2 text-base leading-relaxed">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>This is mainly for a <strong>fun pre-class activity</strong> that you can get to know each other a bit before we meet in the first class.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>Feel free to <strong>comment on each other's cards</strong>, check other people's comments, and modify your LLM bot's replies to your classmates' comments if you're not happy with them.</span>
                  </li>
                </ul>
              </section>

              {/* Future Features */}
              <section>
                <h3 className="text-lg font-bold mb-3 text-black">Coming Soon</h3>
                <ul className="space-y-2 text-base leading-relaxed">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>We will introduce the <strong>Playground feature</strong> in the next few weeks.</span>
                  </li>
                </ul>
              </section>

            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
