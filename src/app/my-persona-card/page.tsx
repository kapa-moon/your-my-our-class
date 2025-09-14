'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCurrentUserId } from '@/lib/auth-utils';

interface PersonaCard {
  id: number;
  userId: number;
  name: string;
  academicBackground: string;
  researchInterest: string;
  recentReading: string;
  learningGoal: string;
  discussionStyle: string;
  createdAt: string;
  updatedAt: string;
}

interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "Click to add...", 
  multiline = false 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-black focus:outline-none resize-vertical min-h-[100px]"
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-black focus:outline-none"
            autoFocus
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-black text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div
        onDoubleClick={handleDoubleClick}
        className="min-h-[40px] px-3 py-2 border border-gray-200 rounded-md cursor-pointer hover:border-gray-300 transition-colors"
      >
        {value ? (
          <div className="whitespace-pre-wrap text-gray-900">{value}</div>
        ) : (
          <div className="text-gray-400 italic">{placeholder}</div>
        )}
      </div>
      <p className="text-xs text-gray-500">Double-click to edit</p>
    </div>
  );
};

export default function MyPersonaCard() {
  const [personaCard, setPersonaCard] = useState<PersonaCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      setUserId(currentUserId);
      fetchPersonaCard(currentUserId);
    } else {
      setError('Please log in to view your persona card');
      setLoading(false);
    }
  }, []);

  const fetchPersonaCard = async (userIdParam: number) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/persona?userId=${userIdParam}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch persona card');
      }

      setPersonaCard(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load persona card');
    } finally {
      setLoading(false);
    }
  };

  const updateField = async (field: keyof PersonaCard, value: string) => {
    if (!personaCard) return;

    try {
      setSaving(true);
      if (!userId) {
        alert('Authentication error. Please log in again.');
        return;
      }

      const updatedPersonaData = {
        ...personaCard,
        [field]: value
      };

      const response = await fetch('/api/persona', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          personaData: updatedPersonaData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update persona card');
      }

      setPersonaCard(data.data);
    } catch (err) {
      alert('Failed to save changes. Please try again.');
      console.error('Error updating persona card:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading your persona card...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-lg text-red-600">Error: {error}</div>
          <Link
            href="/onboarding-ground"
            className="inline-block px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            Complete Survey First
          </Link>
        </div>
      </div>
    );
  }

  if (!personaCard) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">No persona card found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="border-b border-black">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-normal">My Persona Card</h1>
            <Link 
              href="/"
              className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors rounded-md"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Persona Card Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {saving && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
            Saving changes...
          </div>
        )}

        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4 pb-8 border-b border-gray-200">
            <EditableField
              label="Name"
              value={personaCard.name}
              onChange={(value) => updateField('name', value)}
              placeholder="How would you like to be known in class?"
            />
          </div>

          {/* Main Sections */}
          <div className="grid gap-8 md:grid-cols-2">
            <EditableField
              label="Academic Background"
              value={personaCard.academicBackground}
              onChange={(value) => updateField('academicBackground', value)}
              placeholder="Describe your academic background, program, and experience..."
              multiline
            />

            <EditableField
              label="Research Interest"
              value={personaCard.researchInterest}
              onChange={(value) => updateField('researchInterest', value)}
              placeholder="What research topics and questions drive your curiosity?"
              multiline
            />

            <EditableField
              label="Recent Reading/Thoughts"
              value={personaCard.recentReading}
              onChange={(value) => updateField('recentReading', value)}
              placeholder="Share recent readings or experiences that influenced your thinking..."
              multiline
            />

            <EditableField
              label="Learning Goal for the Class"
              value={personaCard.learningGoal}
              onChange={(value) => updateField('learningGoal', value)}
              placeholder="What do you hope to achieve in this class?"
              multiline
            />

            <EditableField
              label="Discussion Style"
              value={personaCard.discussionStyle}
              onChange={(value) => updateField('discussionStyle', value)}
              placeholder="How do you prefer to participate in discussions and group work?"
              multiline
            />
          </div>

          {/* Footer */}
          <div className="pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Last updated: {new Date(personaCard.updatedAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Double-click any field to edit. Changes are saved automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
