'use client';

import Link from 'next/link';

export default function PersonalPlaygroundPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="border-b border-black">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-normal">
              Playground <span className="text-gray-500 text-lg">(Private View)</span>
            </h1>
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center">
          <h2 className="text-xl text-gray-600 mb-4">
            Welcome to Your Playground
          </h2>
          <p className="text-gray-500">
            This feature is coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
