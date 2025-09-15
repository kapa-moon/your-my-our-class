'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCurrentUserId } from '@/lib/auth-utils';

interface SurveyResponse {
  [questionId: string]: string | string[] | number;
}

interface SurveyQuestion {
  id: string;
  type: 'info' | 'text' | 'textarea';
  title: string;
  content: string;
  category?: string;
  placeholder?: string;
  required?: boolean;
  buttonText?: string;
}

export default function OnboardingGround() {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<SurveyResponse>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Get the current user ID on component mount
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      setUserId(currentUserId);
    } else {
      // Redirect to home if no user is found
      window.location.href = '/';
    }
  }, []);

  const surveyQuestions: SurveyQuestion[] = [
    {
      id: 'welcome',
      type: 'info',
      title: 'Welcome to Onboarding Ground',
      content: 'Help us personalize your syllabus by sharing your background, interests, and goals. This will enable us to customize weekly readings and project deliverables specifically for you.',
      buttonText: 'Get Started'
    },
    
    // 1. BASICS
    {
      id: 'preferredName',
      type: 'text',
      category: 'Basics',
      title: 'What should we call you?',
      content: 'Please share your preferred first name for class discussions and interactions.',
      placeholder: 'e.g., Alex, Sam, Jordan...',
      required: true
    },
    {
      id: 'lastName',
      type: 'text',
      category: 'Basics',
      title: 'What\'s your last name?',
      content: 'This helps us maintain proper records and formal communications.',
      placeholder: 'e.g., Smith, Johnson, Garcia...',
      required: true
    },
    {
      id: 'gender',
      type: 'text',
      category: 'Basics',
      title: 'How do you identify your gender?',
      content: 'This is optional and helps us create inclusive discussion groups.',
      placeholder: 'e.g., Female, Male, Non-binary, Prefer not to say...',
      required: false
    },
    {
      id: 'age',
      type: 'text',
      category: 'Basics',
      title: 'What\'s your age range?',
      content: 'This helps us understand different generational perspectives in discussions.',
      placeholder: 'e.g., 22, early 20s, mid-30s, prefer not to say...',
      required: false
    },
    
    // 2. ACADEMIC BACKGROUND
    {
      id: 'academicBackground',
      type: 'textarea',
      category: 'Academic Background',
      title: 'Tell us about your academic and professional background.',
      content: 'Share your current program, relevant experience, key skills, and notable projects or coursework that have shaped your learning.',
      placeholder: 'e.g., "PhD in Computer Science, 3rd year, focusing on AI/ML. Previously worked as data analyst at tech startup. Strong in Python, TensorFlow, statistical analysis. Built recommendation systems and completed thesis research on social media sentiment analysis..."',
      required: true
    },
    
    // 3. RESEARCH INTERESTS
    {
      id: 'researchInterests',
      type: 'textarea',
      category: 'Research Interests',
      title: 'What research topics and questions interest you most?',
      content: 'Describe the areas you\'re curious about, what drives your interest, and any specific aspects or applications you want to explore.',
      placeholder: 'e.g., "Interested in AI ethics and algorithmic bias - particularly transparency in hiring algorithms. Motivated by desire to make technology more equitable. Want to explore how to design fairer ML systems and measure their real-world impact..."',
      required: true
    },
    
    // 4. RECENT READINGS
    {
      id: 'recentReadings',
      type: 'textarea',
      category: 'Recent Readings',
      title: 'What have you read recently that influenced your thinking?',
      content: 'Share 2-3 papers, articles, or books you\'ve engaged with recently, what you learned from them, and why you chose to read them.',
      placeholder: 'e.g., "Read \'Attention Is All You Need\' transformer paper - revolutionized my understanding of sequence modeling and gave me ideas for my thesis. \'Weapons of Math Destruction\' book opened my eyes to real-world algorithmic bias. Professor recommended both for understanding AI\'s societal impact..."',
      required: true
    },
    
    // 5. CLASS GOALS
    {
      id: 'classGoals',
      type: 'textarea',
      category: 'Class Goals',
      title: 'What do you hope to achieve in this class?',
      content: 'Share your motivations for taking this course, potential project ideas, and what success looks like for you.',
      placeholder: 'e.g., "Taking this to understand research methodologies for my thesis on algorithmic fairness. Want to explore bias in hiring algorithms as a project. Success means learning to design rigorous studies and building connections with peers interested in AI ethics..."',
      required: true
    },
    
    // 6. DISCUSSION STYLE
    {
      id: 'discussionStyle',
      type: 'textarea',
      category: 'Discussion Style',
      title: 'How do you prefer to participate in class discussions?',
      content: 'Describe your communication style, how you like to engage with ideas, and what helps you contribute most effectively to group discussions.',
      placeholder: 'e.g., "I like to listen first and then build on others\' ideas. I prefer smaller group discussions where I can ask clarifying questions. I contribute best when I can prepare thoughts beforehand and when there\'s space for different perspectives..."',
      required: true
    }
  ];

  const handleNext = async () => {
    const currentQuestion = surveyQuestions[currentStep];
    
    // Check if current question is required and has no response
    if (currentQuestion.required && !responses[currentQuestion.id]) {
      alert('Please fill in this required field before continuing.');
      return;
    }
    
    if (currentStep < surveyQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save responses to database before completing
      try {
        if (!userId) {
          alert('Authentication error. Please log in again.');
          window.location.href = '/';
          return;
        }
        
        const response = await fetch('/api/survey', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            responses
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to save responses');
        }
        
        setIsCompleted(true);
      } catch (error) {
        alert('Failed to save your responses. Please try again.');
        console.error('Error saving survey:', error);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleResponse = (questionId: string, value: string | string[] | number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const currentValue = responses[question.id] || '';
    
    switch (question.type) {
      case 'info':
        return (
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-light text-black">{question.title}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {question.content}
            </p>
          </div>
        );
      
      case 'text':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            {question.category && (
              <div className="text-sm text-gray-500 uppercase tracking-wide">
                {question.category}
              </div>
            )}
            <h2 className="text-2xl font-light text-black">{question.title}</h2>
            <p className="text-gray-600 leading-relaxed">{question.content}</p>
            <input
              type="text"
              value={currentValue as string}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              placeholder={question.placeholder}
              className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none transition-colors rounded-md"
              required={question.required}
            />
            {question.required && (
              <p className="text-xs text-gray-500">* Required</p>
            )}
          </div>
        );
      
      case 'textarea':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            {question.category && (
              <div className="text-sm text-gray-500 uppercase tracking-wide">
                {question.category}
              </div>
            )}
            <h2 className="text-2xl font-light text-black">{question.title}</h2>
            <p className="text-gray-600 leading-relaxed">{question.content}</p>
            <textarea
              value={currentValue as string}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              placeholder={question.placeholder}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none transition-colors resize-vertical min-h-[120px] rounded-md"
              required={question.required}
            />
            {question.required && (
              <p className="text-xs text-gray-500">* Required</p>
            )}
          </div>
        );
      
      default:
        return (
          <div className="text-center">
            <p>Question type not implemented yet</p>
          </div>
        );
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-white text-black">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center space-y-8 py-16">
            <h1 className="text-4xl font-light text-black">Thank You!</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your responses have been recorded. We appreciate you taking the time to complete our survey.
            </p>
            
            {/* Interview Bot Section */}
            <div className="max-w-2xl mx-auto text-left space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-black">Want to share more?</h3>
                <p className="text-gray-600">
                  Try talking to a bot to elaborate on your responses and help us better understand your academic journey and interest.
                </p>
                <div>
                  <Link
                    href="/onboarding-ground-interview-bot"
                    className="relative group text-black hover:text-orange-600 transition-all duration-300"
                  >
                    <span className="relative z-10">→ Start</span>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500"></span>
                    <span className="absolute inset-0 bg-orange-200 opacity-0 group-hover:opacity-30 transition-opacity duration-300 transform -skew-x-12"></span>
                  </Link>
                </div>
              </div>
              
              <div className="space-y-2 pt-4">
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
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = surveyQuestions[currentStep];

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="border-b border-black">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-normal">Onboarding Ground</h1>
            <Link 
              href="/"
              className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors rounded-md"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{currentStep + 1} of {surveyQuestions.length}</span>
          </div>
          <div className="w-full bg-gray-200 h-2">
            <div 
              className="bg-black h-2 transition-all duration-300 ease-out"
              style={{ width: `${((currentStep + 1) / surveyQuestions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="min-h-[400px] flex flex-col justify-center">
          {renderQuestion(currentQuestion)}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-6 py-3 border border-black text-black hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black rounded-md"
            >
              Previous
            </button>
            
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-black text-white border border-black hover:bg-gray-800 transition-colors rounded-md"
            >
              {currentStep === surveyQuestions.length - 1 ? 'Complete Survey' : currentQuestion.buttonText || 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
