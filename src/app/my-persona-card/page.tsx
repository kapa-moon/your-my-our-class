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
  surveyData?: {
    academicBackground: string;
    researchInterests: string;
    recentReadings: string;
    classGoals: string;
    discussionStyle: string;
  } | null;
  interviewData?: {
    academicBackground: string;
    researchInterest: string;
    recentReading: string;
    learningGoal: string;
    discussionStyle: string;
  } | null;
}

interface PersonaAspect {
  id: string;
  label: string;
  fields: PersonaField[];
}

interface PersonaField {
  id: string;
  content: string;
  source: 'main' | 'survey' | 'interview' | 'custom';
  isEditing?: boolean;
}

interface DynamicAspectProps {
  aspect: PersonaAspect;
  onUpdateField: (aspectId: string, fieldId: string, content: string) => void;
  onAddField: (aspectId: string) => void;
  onDeleteField: (aspectId: string, fieldId: string) => void;
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

const DynamicAspect: React.FC<DynamicAspectProps> = ({ 
  aspect, 
  onUpdateField, 
  onAddField, 
  onDeleteField 
}) => {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const handleDoubleClick = (field: PersonaField) => {
    setEditingFieldId(field.id);
    setEditingContent(field.content);
  };

  const handleSave = (fieldId: string) => {
    onUpdateField(aspect.id, fieldId, editingContent);
    setEditingFieldId(null);
    setEditingContent('');
  };

  const handleCancel = () => {
    setEditingFieldId(null);
    setEditingContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, fieldId: string) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave(fieldId);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'survey': return 'Survey';
      case 'interview': return 'Interview';
      case 'main': return 'Main';
      case 'custom': return 'Added';
      default: return '';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'survey': return 'bg-blue-100 text-blue-800';
      case 'interview': return 'bg-green-100 text-green-800';
      case 'main': return 'bg-gray-100 text-gray-800';
      case 'custom': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateHeight = (content: string) => {
    const lines = content.split('\n').length;
    const estimatedLines = Math.max(lines, Math.ceil(content.length / 60));
    const calculatedHeight = Math.max(60, estimatedLines * 24 + 32); // 24px per line + padding
    return Math.min(calculatedHeight, 200); // Cap at 200px max height
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-lg font-bold text-gray-900">{aspect.label}</label>
        <button
          onClick={() => onAddField(aspect.id)}
          className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Add new field"
        >
          +
        </button>
      </div>
      
      <div className="space-y-3">
        {aspect.fields.map((field) => (
          <div key={field.id} className="relative">
            {field.source !== 'main' && (
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs px-2 py-1 rounded-full ${getSourceColor(field.source)}`}>
                  {getSourceLabel(field.source)}
                </span>
                {field.source === 'custom' && (
                  <button
                    onClick={() => onDeleteField(aspect.id, field.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                    title="Delete field"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
            
            {editingFieldId === field.id ? (
              <div className="space-y-2">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, field.id)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-black focus:outline-none resize-none overflow-y-auto scrollbar-hide"
                  style={{ 
                    height: `${calculateHeight(editingContent)}px`,
                    maxHeight: '200px'
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(field.id)}
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
                <p className="text-xs text-gray-500">Ctrl+Enter to save, Esc to cancel</p>
              </div>
            ) : (
              <div
                onDoubleClick={() => handleDoubleClick(field)}
                className="min-h-[60px] px-3 py-2 border border-gray-200 rounded-md cursor-pointer hover:border-gray-300 transition-colors overflow-y-auto scrollbar-hide"
                style={{ 
                  height: `${calculateHeight(field.content)}px`,
                  maxHeight: '200px'
                }}
              >
                {field.content ? (
                  <div className="whitespace-pre-wrap text-gray-900">{field.content}</div>
                ) : (
                  <div className="text-gray-400 italic">Double-click to add content...</div>
                )}
              </div>
            )}
            
            {editingFieldId !== field.id && (
              <p className="text-xs text-gray-500 mt-1">Double-click to edit</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const PresentableEditableField: React.FC<{
  fieldPath: string;
  content: string;
  isEditing: boolean;
  editingContent: string;
  onDoubleClick: (fieldPath: string, content: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onContentChange: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  className?: string;
}> = ({ 
  fieldPath, 
  content, 
  isEditing, 
  editingContent, 
  onDoubleClick, 
  onSave, 
  onCancel, 
  onContentChange, 
  onKeyDown,
  className = ''
}) => {
  if (isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          value={editingContent}
          onChange={(e) => onContentChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-black focus:outline-none resize-none overflow-y-auto scrollbar-hide"
          style={{ 
            minHeight: '80px',
            maxHeight: '200px'
          }}
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="px-3 py-1 bg-black text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
        <p className="text-xs text-gray-500">Ctrl+Enter to save, Esc to cancel</p>
      </div>
    );
  }

  return (
    <div
      onDoubleClick={() => onDoubleClick(fieldPath, content)}
      className={`cursor-pointer hover:bg-gray-50 transition-colors rounded p-1 ${className}`}
    >
      {content ? (
        <div dangerouslySetInnerHTML={{ 
          __html: content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
        }} />
      ) : (
        <div className="text-gray-400 italic">Double-click to add content...</div>
      )}
      {!isEditing && (
        <p className="text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Double-click to edit
        </p>
      )}
    </div>
  );
};

interface PresentablePersona {
  header: {
    name: string;
    affiliation: string;
  };
  leftColumn: {
    background: string;
    discussionStyle: string;
  };
  rightColumn: {
    guidingQuestion: string;
    learningGoals: string;
    recentInterests: string;
  };
}

export default function MyPersonaCard() {
  const [personaCard, setPersonaCard] = useState<PersonaCard | null>(null);
  const [aspects, setAspects] = useState<PersonaAspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState<string>('');
  const [generationComplete, setGenerationComplete] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'raw' | 'presentable'>('raw');
  const [presentablePersona, setPresentablePersona] = useState<PresentablePersona | null>(null);
  const [generatingPresentable, setGeneratingPresentable] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

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

  const buildAspectsFromPersonaCard = (card: PersonaCard): PersonaAspect[] => {
    const aspectMapping = [
      { id: 'academicBackground', label: 'Academic Background', mainKey: 'academicBackground', surveyKey: 'academicBackground', interviewKey: 'academicBackground' },
      { id: 'researchInterest', label: 'Research Interest', mainKey: 'researchInterest', surveyKey: 'researchInterests', interviewKey: 'researchInterest' },
      { id: 'recentReading', label: 'Recent Reading/Thoughts', mainKey: 'recentReading', surveyKey: 'recentReadings', interviewKey: 'recentReading' },
      { id: 'learningGoal', label: 'Learning Goal for the Class', mainKey: 'learningGoal', surveyKey: 'classGoals', interviewKey: 'learningGoal' },
      { id: 'discussionStyle', label: 'Discussion Style', mainKey: 'discussionStyle', surveyKey: 'discussionStyle', interviewKey: 'discussionStyle' }
    ];

    return aspectMapping.map(aspect => {
      const fields: PersonaField[] = [];

      // Add survey field if available (prioritize survey data)
      if (card.surveyData) {
        const surveyContent = card.surveyData[aspect.surveyKey as keyof typeof card.surveyData] || '';
        if (surveyContent) {
          fields.push({
            id: `${aspect.id}-survey`,
            content: surveyContent,
            source: 'survey'
          });
        }
      }

      // Add main field only if no survey data or if different from survey
      const mainContent = card[aspect.mainKey as keyof PersonaCard] as string || '';
      const surveyContent = card.surveyData?.[aspect.surveyKey as keyof typeof card.surveyData] || '';
      if (mainContent && mainContent !== surveyContent) {
        fields.push({
          id: `${aspect.id}-main`,
          content: mainContent,
          source: 'main'
        });
      }

      // Add interview field if available
      if (card.interviewData) {
        const interviewContent = card.interviewData[aspect.interviewKey as keyof typeof card.interviewData] || '';
        if (interviewContent) {
          fields.push({
            id: `${aspect.id}-interview`,
            content: interviewContent,
            source: 'interview'
          });
        }
      }

      // Ensure at least one field exists
      if (fields.length === 0) {
        fields.push({
          id: `${aspect.id}-main`,
          content: mainContent || '',
          source: 'main'
        });
      }

      return {
        id: aspect.id,
        label: aspect.label,
        fields
      };
    });
  };

  const fetchPersonaCard = async (userIdParam: number) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/persona?userId=${userIdParam}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch persona card');
      }

      setPersonaCard(data.data);
      setAspects(buildAspectsFromPersonaCard(data.data));
      
      // Also try to load existing presentable persona
      loadPresentablePersona(userIdParam);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load persona card');
    } finally {
      setLoading(false);
    }
  };

  const loadPresentablePersona = async (userIdParam: number) => {
    try {
      const response = await fetch(`/api/persona-summary?userId=${userIdParam}`);
      const data = await response.json();

      if (data.success) {
        setPresentablePersona(data.data);
      }
      // If no presentable persona exists, that's fine - user can generate one
    } catch {
      console.log('No existing presentable persona found');
    }
  };

  const handleUpdateField = async (aspectId: string, fieldId: string, content: string) => {
    if (!personaCard) return;

    // Update local state immediately
    setAspects(prevAspects => 
      prevAspects.map(aspect => 
        aspect.id === aspectId 
          ? {
              ...aspect,
              fields: aspect.fields.map(field => 
                field.id === fieldId 
                  ? { ...field, content }
                  : field
              )
            }
          : aspect
      )
    );

    // If updating main field, also save to persona card
    const field = aspects.find(a => a.id === aspectId)?.fields.find(f => f.id === fieldId);
    if (field?.source === 'main') {
      try {
        setSaving(true);
        if (!userId) {
          alert('Authentication error. Please log in again.');
          return;
        }

        const updatedPersonaData = {
          ...personaCard,
          [aspectId]: content
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
    }
  };

  const handleAddField = (aspectId: string) => {
    const newFieldId = `${aspectId}-custom-${Date.now()}`;
    setAspects(prevAspects => 
      prevAspects.map(aspect => 
        aspect.id === aspectId 
          ? {
              ...aspect,
              fields: [...aspect.fields, {
                id: newFieldId,
                content: '',
                source: 'custom'
              }]
            }
          : aspect
      )
    );
  };

  const handleDeleteField = (aspectId: string, fieldId: string) => {
    setAspects(prevAspects => 
      prevAspects.map(aspect => 
        aspect.id === aspectId 
          ? {
              ...aspect,
              fields: aspect.fields.filter(field => field.id !== fieldId)
            }
          : aspect
      )
    );
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
      setAspects(buildAspectsFromPersonaCard(data.data));
    } catch (err) {
      alert('Failed to save changes. Please try again.');
      console.error('Error updating persona card:', err);
    } finally {
      setSaving(false);
    }
  };

  const generatePresentablePersona = async () => {
    if (!userId) {
      alert('Please log in to generate presentable persona.');
      return;
    }

    try {
      setGeneratingPresentable(true);

      const response = await fetch('/api/persona-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          forceRegenerate: true // Always regenerate when manually triggered
        })
      });

      const data = await response.json();

      if (data.success) {
        setPresentablePersona(data.data);
        setViewMode('presentable');
      } else {
        alert(data.error || 'Failed to generate presentable persona');
      }
    } catch (error) {
      alert('An error occurred while generating presentable persona');
      console.error('Error generating presentable persona:', error);
    } finally {
      setGeneratingPresentable(false);
    }
  };

  const handlePresentableEdit = async (fieldPath: string, value: string) => {
    if (!userId || !presentablePersona) return;

    try {
      setSaving(true);

      // Update local state immediately
      const updatedPersona = { ...presentablePersona };
      const [section, field] = fieldPath.split('.');
      
      if (section === 'header') {
        (updatedPersona.header as any)[field] = value;
      } else if (section === 'leftColumn') {
        (updatedPersona.leftColumn as any)[field] = value;
      } else if (section === 'rightColumn') {
        (updatedPersona.rightColumn as any)[field] = value;
      }
      
      setPresentablePersona(updatedPersona);

      // Save to database
      const response = await fetch('/api/persona-summary', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          field: fieldPath,
          value
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update presentable persona');
      }

    } catch (error) {
      alert('Failed to save changes. Please try again.');
      console.error('Error updating presentable persona:', error);
      // Reload from server on error
      if (userId) loadPresentablePersona(userId);
    } finally {
      setSaving(false);
    }
  };

  const handlePresentableDoubleClick = (fieldPath: string, currentValue: string) => {
    setEditingField(fieldPath);
    setEditingContent(currentValue);
  };

  const handlePresentableSave = async () => {
    if (editingField) {
      await handlePresentableEdit(editingField, editingContent);
      setEditingField(null);
      setEditingContent('');
    }
  };

  const handlePresentableCancel = () => {
    setEditingField(null);
    setEditingContent('');
  };

  const handlePresentableKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handlePresentableSave();
    } else if (e.key === 'Escape') {
      handlePresentableCancel();
    }
  };

  const generatePersonalizedSyllabus = async () => {
    if (!userId) {
      alert('Please log in to generate your personalized syllabus.');
      return;
    }

    try {
      setGenerating(true);
      setGenerationMessage('');
      setGenerationComplete(false);

      // Generate papers for weeks 2-9 (content weeks)
      const weeks = ['2', '3', '4', '5', '6', '7', '8', '9'];
      const weekNames = {
        '2': 'AI-Mediated Communication',
        '3': 'LLMs and role play', 
        '4': 'Social Bots',
        '5': 'Models interacting with each other',
        '6': 'Deception and Truth',
        '7': 'LLMs reflecting human diversity',
        '8': 'LLMs as content analysts',
        '9': 'Reflections on human cognition'
      };

      setGenerationMessage('🤖 AI is analyzing your interests and matching papers...');

      let successCount = 0;
      let failCount = 0;

      for (const week of weeks) {
        try {
          setGenerationMessage(`🤖 Generating personalized papers for Week ${week}: ${weekNames[week as keyof typeof weekNames]}...`);
          
          const response = await fetch('/api/personalized-papers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              weekNumber: week,
              forceRegenerate: true // Always regenerate when manually triggered
            })
          });

          const data = await response.json();

          if (response.ok) {
            successCount++;
            console.log(`Generated papers for week ${week}:`, data.papers?.length || 0);
          } else {
            failCount++;
            console.error(`Failed to generate papers for week ${week}:`, data.error);
          }
        } catch (weekError) {
          // failCount++;
          console.error(`Error generating papers for week ${week}:`, weekError);
        }
      }

      if (successCount === weeks.length) {
        setGenerationMessage(`✅ Success! Generated personalized papers for all ${successCount} weeks.`);
        setGenerationComplete(true);
      } else if (successCount > 0) {
        setGenerationMessage(`⚠️ Partially successful: Generated papers for ${successCount}/${weeks.length} weeks. Some weeks may have failed.`);
        setGenerationComplete(true);
      } else {
        setGenerationMessage(`❌ Failed to generate personalized papers. Please try again or check your internet connection.`);
        setGenerationComplete(false);
      }

    } catch (error) {
      console.error('Error generating personalized syllabus:', error);
      setGenerationMessage('❌ An error occurred while generating your personalized syllabus. Please try again.');
      setGenerationComplete(false);
    } finally {
      setGenerating(false);
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  if (viewMode === 'raw') {
                    if (presentablePersona) {
                      setViewMode('presentable');
                    } else {
                      generatePresentablePersona();
                    }
                  } else {
                    setViewMode('raw');
                  }
                }}
                disabled={generatingPresentable}
                className={`px-4 py-2 border border-black rounded-md transition-colors ${
                  generatingPresentable
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'text-black hover:bg-black hover:text-white'
                }`}
              >
                {generatingPresentable ? 'Generating...' : 
                 viewMode === 'raw' ? 'Switch to Persona Card' : 'Switch to Raw Content'}
              </button>
              <Link 
                href="/"
                className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors rounded-md"
              >
                ← Back to Home
              </Link>
            </div>
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

        {viewMode === 'raw' ? (
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

            {/* Dynamic Aspects */}
            <div className="grid gap-8 md:grid-cols-2">
              {aspects.map((aspect) => (
                <DynamicAspect
                  key={aspect.id}
                  aspect={aspect}
                  onUpdateField={handleUpdateField}
                  onAddField={handleAddField}
                  onDeleteField={handleDeleteField}
                />
              ))}
            </div>

            {/* Generate Personalized Syllabus Section */}
            <div className="pt-8 border-t border-gray-200 text-center space-y-4">
              {generating && generationMessage && (
                <div className="text-sm text-gray-600 mb-4">
                  {generationMessage}
                </div>
              )}
              
              {generationComplete && !generating ? (
                <Link
                  href="/syllabus"
                  className="inline-flex items-center px-6 py-3 border border-black text-black bg-white hover:bg-black hover:text-white transition-colors rounded-md font-medium"
                >
                  Go to Syllabus
                </Link>
              ) : (
                <button
                  onClick={generatePersonalizedSyllabus}
                  disabled={generating || !personaCard}
                  className={`inline-flex items-center px-6 py-3 border border-black rounded-md font-medium transition-colors ${
                    generating || !personaCard
                      ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                      : 'text-black bg-white hover:bg-black hover:text-white'
                  }`}
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    '(Re)generate My Syllabus'
                  )}
                </button>
              )}
              
              {!personaCard && !generating && (
                <p className="text-xs text-red-500 mt-2">
                  Please complete your persona card first
                </p>
              )}
            </div>
          </div>
        ) : presentablePersona ? (
          /* Presentable Persona Card */
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center pb-8 border-b border-gray-200 mb-8 group">
              <div className="mb-2">
                <PresentableEditableField
                  fieldPath="header.name"
                  content={presentablePersona.header.name}
                  isEditing={editingField === 'header.name'}
                  editingContent={editingContent}
                  onDoubleClick={handlePresentableDoubleClick}
                  onSave={handlePresentableSave}
                  onCancel={handlePresentableCancel}
                  onContentChange={setEditingContent}
                  onKeyDown={handlePresentableKeyDown}
                  className="text-3xl font-bold text-black"
                />
              </div>
              <PresentableEditableField
                fieldPath="header.affiliation"
                content={presentablePersona.header.affiliation}
                isEditing={editingField === 'header.affiliation'}
                editingContent={editingContent}
                onDoubleClick={handlePresentableDoubleClick}
                onSave={handlePresentableSave}
                onCancel={handlePresentableCancel}
                onContentChange={setEditingContent}
                onKeyDown={handlePresentableKeyDown}
                className="text-lg text-gray-600"
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column (narrower) */}
              <div className="md:col-span-1 space-y-6">
                <div className="group">
                  <h3 className="text-lg font-bold text-black mb-3 border-b border-orange-500 pb-1">Background</h3>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    <PresentableEditableField
                      fieldPath="leftColumn.background"
                      content={presentablePersona.leftColumn.background}
                      isEditing={editingField === 'leftColumn.background'}
                      editingContent={editingContent}
                      onDoubleClick={handlePresentableDoubleClick}
                      onSave={handlePresentableSave}
                      onCancel={handlePresentableCancel}
                      onContentChange={setEditingContent}
                      onKeyDown={handlePresentableKeyDown}
                    />
                  </div>
                </div>

                <div className="group">
                  <h3 className="text-lg font-bold text-black mb-3 border-b border-orange-500 pb-1">Discussion Style</h3>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    <PresentableEditableField
                      fieldPath="leftColumn.discussionStyle"
                      content={presentablePersona.leftColumn.discussionStyle}
                      isEditing={editingField === 'leftColumn.discussionStyle'}
                      editingContent={editingContent}
                      onDoubleClick={handlePresentableDoubleClick}
                      onSave={handlePresentableSave}
                      onCancel={handlePresentableCancel}
                      onContentChange={setEditingContent}
                      onKeyDown={handlePresentableKeyDown}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column (wider) */}
              <div className="md:col-span-2 space-y-6">
                <div className="group">
                  <h3 className="text-lg font-bold text-black mb-3 border-b border-orange-500 pb-1">🤔 My (recent) Guiding Question</h3>
                  <div className="text-gray-700 leading-relaxed">
                    <PresentableEditableField
                      fieldPath="rightColumn.guidingQuestion"
                      content={presentablePersona.rightColumn.guidingQuestion}
                      isEditing={editingField === 'rightColumn.guidingQuestion'}
                      editingContent={editingContent}
                      onDoubleClick={handlePresentableDoubleClick}
                      onSave={handlePresentableSave}
                      onCancel={handlePresentableCancel}
                      onContentChange={setEditingContent}
                      onKeyDown={handlePresentableKeyDown}
                    />
                  </div>
                </div>

                <div className="group">
                  <h3 className="text-lg font-bold text-black mb-3 border-b border-orange-500 pb-1">🎯 What I want to learn and do in this class</h3>
                  <div className="text-gray-700 leading-relaxed">
                    <PresentableEditableField
                      fieldPath="rightColumn.learningGoals"
                      content={presentablePersona.rightColumn.learningGoals}
                      isEditing={editingField === 'rightColumn.learningGoals'}
                      editingContent={editingContent}
                      onDoubleClick={handlePresentableDoubleClick}
                      onSave={handlePresentableSave}
                      onCancel={handlePresentableCancel}
                      onContentChange={setEditingContent}
                      onKeyDown={handlePresentableKeyDown}
                    />
                  </div>
                </div>

                <div className="group">
                  <h3 className="text-lg font-bold text-black mb-3 border-b border-orange-500 pb-1">💭 Recently I am interested in...</h3>
                  <div className="text-gray-700 leading-relaxed">
                    <PresentableEditableField
                      fieldPath="rightColumn.recentInterests"
                      content={presentablePersona.rightColumn.recentInterests}
                      isEditing={editingField === 'rightColumn.recentInterests'}
                      editingContent={editingContent}
                      onDoubleClick={handlePresentableDoubleClick}
                      onSave={handlePresentableSave}
                      onCancel={handlePresentableCancel}
                      onContentChange={setEditingContent}
                      onKeyDown={handlePresentableKeyDown}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500">Click &quot;Switch to Persona Card&quot; to generate your presentable persona card.</p>
          </div>
        )}

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
  );
}
