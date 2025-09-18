'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCurrentUserId } from '@/lib/auth-utils';
import ColorableAvatar from '@/components/ColorableAvatar';

interface PersonaCard {
  id: number;
  userId: number;
  name: string;
  academicBackground: string;
  researchInterest: string;
  recentReading: string;
  learningGoal: string;
  discussionStyle: string;
  avatarColor?: string;
  academicBackgroundSubBullets?: string;
  researchInterestSubBullets?: string;
  recentReadingSubBullets?: string;
  learningGoalSubBullets?: string;
  introMessage?: string;
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

interface SubBulletPoint {
  id: string;
  content: string;
  isChecked: boolean;
  isConfirmed?: boolean; // Whether the user has confirmed their selection
}

interface BulletPointSectionProps {
  emoji: string;
  title: string;
  content: string;
  aspectId: string;
  onContentChange?: (newContent: string) => void;
  onSubBulletsChange?: (subBullets: SubBulletPoint[]) => void;
  savedSubBullets?: string; // JSON string from database
}

const BulletPointSection: React.FC<BulletPointSectionProps> = ({ 
  emoji, 
  title, 
  content, 
  aspectId,
  onContentChange,
  onSubBulletsChange,
  savedSubBullets
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [subBullets, setSubBullets] = useState<SubBulletPoint[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  
  // Update edit content when prop changes
  useEffect(() => {
    setEditContent(content);
  }, [content]);
  
  // Initialize sub-bullets when content changes
  useEffect(() => {
    let bullets: SubBulletPoint[] = [];
    
    // Try to load saved sub-bullets first
    if (savedSubBullets) {
      try {
        bullets = JSON.parse(savedSubBullets);
      } catch (e) {
        console.error('Error parsing saved sub-bullets:', e);
      }
    }
    
    // If no saved bullets, create empty placeholders
    if (bullets.length === 0) {
      bullets = [
        { id: `${aspectId}-sub-0`, content: '', isChecked: false, isConfirmed: true },
        { id: `${aspectId}-sub-1`, content: '', isChecked: false, isConfirmed: true },
        { id: `${aspectId}-sub-2`, content: '', isChecked: false, isConfirmed: true }
      ];
    }
    
    setSubBullets(bullets);
  }, [savedSubBullets, aspectId]);

  const getSubBulletTemplates = (aspectId: string): string[] => {
    switch (aspectId) {
      case 'academicBackground':
        return [
          'Currently pursuing [degree] in [field] with focus on [specialization]',
          'Background includes [previous experience/education] that shaped current interests',
          'Developed expertise in [key skills/methods] through [specific experiences]'
        ];
      case 'researchInterest':
        return [
          'Passionate about [specific research area] with focus on [particular aspect]',
          'Interested in exploring [methodological approach] to understand [phenomenon]',
          'Future research aims to investigate [research question/problem]'
        ];
      case 'recentReading':
        return [
          'Recently read [paper/book] which challenged thinking about [topic]',
          'Key insight gained: [specific learning/realization about field]',
          'Currently exploring [new area/question] inspired by recent readings'
        ];
      case 'learningGoal':
        return [
          'Want to develop [specific skill] to advance [career/research goal]',
          'Project idea: [brief description of what they want to build/study]',
          'Hope to gain [knowledge/perspective] that will help with [future application]'
        ];
      default:
        return [
          'Key aspect that defines this area',
          'Specific detail about their approach',
          'Future direction or goal in this area'
        ];
    }
  };

  const handleSubBulletToggle = (id: string) => {
    const newSubBullets = subBullets.map(bullet => 
      bullet.id === id 
        ? { ...bullet, isChecked: !bullet.isChecked }
        : bullet
    );
    
    setSubBullets(newSubBullets);
    
    // Save to database
    if (onSubBulletsChange) {
      onSubBulletsChange(newSubBullets);
    }
  };

  const getCheckedSubBullets = () => {
    return subBullets.filter(bullet => bullet.isChecked);
  };

  const handleSave = () => {
    if (onContentChange) {
      onContentChange(editContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="py-2">
      {/* Main bullet point */}
      <div className="flex items-start space-x-3">
        <span className="text-xl flex-shrink-0 mt-1">{emoji}</span>
        <div className="flex-grow">
          {isEditing ? (
            <div className="mb-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-black focus:outline-none resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
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
              <p className="text-xs text-gray-500 mt-1">Ctrl+Enter to save, Esc to cancel</p>
            </div>
          ) : (
            <p 
              className="text-gray-700 leading-relaxed mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
              onDoubleClick={() => setIsEditing(true)}
            >
              {content || 'No content available. Double-click to add content.'}
            </p>
          )}
          
          {!isEditing && (
            <p className="text-xs text-gray-400 mb-2">Double-click to edit</p>
          )}
          
          {/* Show more link */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none"
          >
            {isExpanded ? 'show less' : 'show more'}
          </button>
          
          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-4 pl-4">
              <div className="space-y-3">
                {/* Show checkbox interface only for newly generated sub-bullets that haven't been confirmed yet */}
                {subBullets.some(bullet => bullet.content && !bullet.isConfirmed) ? (
                  <>
                    <p className="text-sm text-gray-600 mb-3">
                      Select the sub-points you'd like to keep for this section:
                    </p>
                    {subBullets.map((bullet) => bullet.content ? (
                      <div key={bullet.id} className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id={bullet.id}
                          checked={bullet.isChecked}
                          onChange={() => handleSubBulletToggle(bullet.id)}
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={bullet.id}
                          className={`text-sm leading-relaxed cursor-pointer flex-grow ${
                            bullet.isChecked ? 'text-gray-900' : 'text-gray-500'
                          }`}
                        >
                          {bullet.content}
                        </label>
                      </div>
                    ) : null)}
                    <button
                      onClick={() => {
                        // Mark all bullets as confirmed and save
                        const confirmedBullets = subBullets.map(bullet => ({
                          ...bullet,
                          isConfirmed: true
                        }));
                        setSubBullets(confirmedBullets);
                        if (onSubBulletsChange) {
                          onSubBulletsChange(confirmedBullets);
                        }
                      }}
                      className="mt-3 px-4 py-2 bg-black text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
                    >
                      Save Selection
                    </button>
                  </>
                ) : (
                  /* Show selected sub-bullets as editable bullet points */
                  <>
                    {getCheckedSubBullets().length > 0 ? (
                      <div className="space-y-3">
                        {getCheckedSubBullets().map((bullet) => (
                          <EditableSubBullet
                            key={bullet.id}
                            bullet={bullet}
                            onUpdate={(updatedBullet) => {
                              const newSubBullets = subBullets.map(b => 
                                b.id === updatedBullet.id ? updatedBullet : b
                              );
                              setSubBullets(newSubBullets);
                              if (onSubBulletsChange) {
                                onSubBulletsChange(newSubBullets);
                              }
                            }}
                            onDelete={(bulletId) => {
                              const newSubBullets = subBullets.filter(b => b.id !== bulletId);
                              setSubBullets(newSubBullets);
                              if (onSubBulletsChange) {
                                onSubBulletsChange(newSubBullets);
                              }
                            }}
                          />
                        ))}
                        <button
                          onClick={() => {
                            const newBullet: SubBulletPoint = {
                              id: `${aspectId}-custom-${Date.now()}`,
                              content: '',
                              isChecked: true,
                              isConfirmed: true
                            };
                            const newSubBullets = [...subBullets, newBullet];
                            setSubBullets(newSubBullets);
                            if (onSubBulletsChange) {
                              onSubBulletsChange(newSubBullets);
                            }
                          }}
                          className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
                            +
                          </div>
                          <span>Add sub-point</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-sm text-gray-500 italic">
                          No sub-points selected yet. Generate persona card to get AI-suggested sub-points.
                        </div>
                        <button
                          onClick={() => {
                            const newBullet: SubBulletPoint = {
                              id: `${aspectId}-custom-${Date.now()}`,
                              content: '',
                              isChecked: true,
                              isConfirmed: true
                            };
                            const newSubBullets = [...subBullets, newBullet];
                            setSubBullets(newSubBullets);
                            if (onSubBulletsChange) {
                              onSubBulletsChange(newSubBullets);
                            }
                          }}
                          className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
                            +
                          </div>
                          <span>Add sub-point</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface EditableTextProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

interface EditableSubBulletProps {
  bullet: SubBulletPoint;
  onUpdate: (bullet: SubBulletPoint) => void;
  onDelete: (bulletId: string) => void;
}

const EditableSubBullet: React.FC<EditableSubBulletProps> = ({ bullet, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(bullet.content);

  useEffect(() => {
    setEditValue(bullet.content);
  }, [bullet.content]);

  // Auto-edit mode for new empty bullets
  useEffect(() => {
    if (!bullet.content) {
      setIsEditing(true);
    }
  }, [bullet.content]);

  const handleSave = () => {
    onUpdate({ ...bullet, content: editValue });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (!bullet.content) {
      // Delete empty bullet if canceling on new one
      onDelete(bullet.id);
    } else {
      setEditValue(bullet.content);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-start space-x-2">
        <span className="text-gray-400 mt-1">•</span>
        <div className="flex-grow space-y-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter sub-point content..."
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-black focus:outline-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-2 py-1 bg-black text-white text-xs rounded hover:bg-gray-800 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-2 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start space-x-2 hover:bg-gray-50 rounded p-1 transition-colors">
      <span className="text-gray-400 mt-1">•</span>
      <div className="flex-grow">
        <span 
          className="text-sm text-gray-700 cursor-pointer block"
          onDoubleClick={() => setIsEditing(true)}
          title="Double-click to edit"
        >
          {bullet.content || 'Empty sub-point'}
        </span>
      </div>
      <button
        onClick={() => onDelete(bullet.id)}
        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs transition-opacity"
        title="Delete sub-point"
      >
        ×
      </button>
    </div>
  );
};

const EditableText: React.FC<EditableTextProps> = ({ 
  value, 
  onSave, 
  className = '', 
  placeholder = 'Click to edit',
  multiline = false 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Enter' && e.ctrlKey && multiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-black focus:outline-none resize-none"
            rows={4}
            style={{ minHeight: '100px' }}
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
        <p className="text-xs text-gray-500">
          {multiline ? 'Ctrl+Enter to save, Esc to cancel' : 'Enter to save, Esc to cancel'}
        </p>
      </div>
    );
  }

  return (
    <div 
      className={`cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors ${className}`}
      onDoubleClick={() => setIsEditing(true)}
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
      <p className="text-xs text-gray-400 opacity-0 hover:opacity-100 transition-opacity">
        Double-click to edit
      </p>
    </div>
  );
};

export default function MyPersonaCard() {
  const [personaCard, setPersonaCard] = useState<PersonaCard | null>(null);
  const [aspects, setAspects] = useState<PersonaAspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'raw' | 'presentable'>('presentable');
  const [presentablePersona, setPresentablePersona] = useState<PresentablePersona | null>(null);
  const [generatingPresentable, setGeneratingPresentable] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isTipBoxVisible, setIsTipBoxVisible] = useState(true);

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

  const handleAvatarColorChange = async (color: string) => {
    await updateField('avatarColor', color);
  };

  const handleSubBulletsUpdate = async (aspectId: string, subBullets: SubBulletPoint[]) => {
    const fieldName = `${aspectId}SubBullets` as keyof PersonaCard;
    await updateField(fieldName, JSON.stringify(subBullets));
  };

  const generatePresentablePersona = async (switchView: boolean = true) => {
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
        // The API now returns updated persona card data, so refresh the whole card
        await fetchPersonaCard(userId);
        
        // Only switch view if requested (default behavior for header button)
        if (switchView) {
          setViewMode('presentable');
        }
      } else {
        alert(data.error || 'Failed to generate persona card');
      }
    } catch (error) {
      alert('An error occurred while generating persona card');
      console.error('Error generating persona card:', error);
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
        <div className="max-w-7xl mx-auto px-4 py-4">
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
                 viewMode === 'raw' ? 'Switch to Persona Card View' : 'Switch to Raw Content'}
              </button>
              <Link 
                href="/the-square"
                className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors rounded-md"
              >
                Go to The Square
              </Link>
              <Link 
                href="/"
                className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors rounded-md"
              >
                ← Back to Home
              </Link>
              <Link 
                href="/syllabus"
                className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors rounded-md"
              >
                View My Syllabus →
              </Link>
            </div>
          </div>
        </div>
      </div>


      {/* Persona Card Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {saving && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
            Saving changes...
          </div>
        )}

        {viewMode === 'raw' ? (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4 pb-8 border-b border-gray-200">
              <div className="flex flex-col items-center space-y-4">
                <ColorableAvatar
                  initialColor={personaCard.avatarColor || '#262D59'}
                  onColorChange={handleAvatarColorChange}
                  size={120}
                  showColorPicker={true}
                />
                <EditableField
                  label="Name"
                  value={personaCard.name}
                  onChange={(value) => updateField('name', value)}
                  placeholder="How would you like to be known in class?"
                />
              </div>
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

            {/* Generate Persona Card Section */}
            <div className="pt-8 border-t border-gray-200 text-center space-y-4">
              <button
                onClick={() => generatePresentablePersona(false)}
                disabled={generatingPresentable}
                className={`inline-flex items-center px-6 py-3 border border-black rounded-md font-medium transition-colors ${
                  generatingPresentable
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'text-black bg-white hover:bg-black hover:text-white'
                }`}
              >
                {generatingPresentable ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
                    Generating...
                  </>
                ) : (
                  '(Re)generate my Persona Card'
                )}
              </button>
              <p className="text-xs text-gray-500">
                AI will summarize your survey/interview responses into concise persona content with sub-bullet points
              </p>
            </div>

            {/* Generate Personalized Syllabus Section */}
            <div className="pt-8 border-t border-gray-200 text-center space-y-4">
              <Link
                href="/syllabus"
                className="inline-flex items-center px-6 py-3 border border-black text-black bg-white hover:bg-black hover:text-white transition-colors rounded-md font-medium"
              >
                Go to Syllabus
              </Link>
            </div>
          </div>
        ) : personaCard ? (
          <>
          {/* Name Card Style Persona Card with Tip Box */}
          <div className={`flex gap-6 items-start ${!isTipBoxVisible ? 'justify-center' : ''}`}>
            <div className={`${isTipBoxVisible ? 'flex-1 max-w-4xl' : 'max-w-4xl'}`}>
              {/* Name Card Container */}
              <div className="border-2 border-black rounded-lg p-8 shadow-lg" style={{backgroundColor: '#fdf7f2'}}>
                {/* Header with Avatar and Basic Info */}
                <div className="flex items-start space-x-6 mb-8">
                  {/* Avatar with color customization */}
                  <div className="flex-shrink-0">
                <ColorableAvatar
                  initialColor={personaCard.avatarColor || '#262D59'}
                      size={80}
                      showColorPicker={true}
                      onColorChange={handleAvatarColorChange}
                />
              </div>
                  
                  {/* Basic Info */}
                  <div className="flex-grow">
                    <EditableText
                      value={personaCard.name || 'Student'}
                      onSave={(value) => updateField('name', value)}
                      className="text-2xl font-bold text-black mb-2"
                      placeholder="Enter your name"
                    />
                    <EditableText
                      value={presentablePersona?.header.affiliation || 'Student'}
                      onSave={(value) => handlePresentableEdit('header.affiliation', value)}
                      className="text-lg text-gray-600"
                      placeholder="Enter your affiliation (e.g., PhD Student in HCI, MS in Data Science)"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Double-click to edit name and affiliation
                    </p>
                  </div>
            </div>

                {/* Four Bullet Points */}
                <div className="space-y-6">
                  {/* Academic Background */}
                  <BulletPointSection
                    emoji="🔖"
                    title="Academic Background"
                    content={personaCard.academicBackground || ''}
                    aspectId="academicBackground"
                    onContentChange={(value) => updateField('academicBackground', value)}
                    onSubBulletsChange={(subBullets) => handleSubBulletsUpdate('academicBackground', subBullets)}
                    savedSubBullets={personaCard.academicBackgroundSubBullets}
                  />

                  {/* Research Interest */}
                  <BulletPointSection
                    emoji="🤔"
                    title="Research Interest"
                    content={personaCard.researchInterest || ''}
                    aspectId="researchInterest"
                    onContentChange={(value) => updateField('researchInterest', value)}
                    onSubBulletsChange={(subBullets) => handleSubBulletsUpdate('researchInterest', subBullets)}
                    savedSubBullets={personaCard.researchInterestSubBullets}
                  />

                  {/* Recent Reading/Thoughts */}
                  <BulletPointSection
                    emoji="💭"
                    title="Recent Reading/Thoughts"
                    content={personaCard.recentReading || ''}
                    aspectId="recentReading"
                    onContentChange={(value) => updateField('recentReading', value)}
                    onSubBulletsChange={(subBullets) => handleSubBulletsUpdate('recentReading', subBullets)}
                    savedSubBullets={personaCard.recentReadingSubBullets}
                  />

                  {/* Learning Goal for the Class */}
                  <BulletPointSection
                    emoji="🎯"
                    title="Learning Goal for the Class"
                    content={personaCard.learningGoal || ''}
                    aspectId="learningGoal"
                    onContentChange={(value) => updateField('learningGoal', value)}
                    onSubBulletsChange={(subBullets) => handleSubBulletsUpdate('learningGoal', subBullets)}
                    savedSubBullets={personaCard.learningGoalSubBullets}
                  />
                </div>

              </div>
            </div>
            
            {/* Right Side Content */}
            <div className="flex-shrink-0 w-72 ml-auto space-y-6">
              {/* Tip Box */}
              {isTipBoxVisible && (
                <div>
                  <div className="bg-white border border-black py-4 px-5 relative text-black" style={{fontFamily: 'inherit'}}>
                    <button
                      onClick={() => setIsTipBoxVisible(false)}
                      className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                      style={{backgroundColor: '#ff305d'}}
                      title="Close tip box"
                      aria-label="Close tip box"
                    ></button>
                    <p className="text-sm leading-relaxed">
                      <strong>💡 Tip:</strong> Check the bullet points that represent you well! This persona card will be shown to your peers in the &quot;Square of Classmates&apos; Personas&quot; later on. You can also double-click to edit any content as you want to make it perfect.
                    </p>
                  </div>
                </div>
              )}

              {/* Hi Message Section */}
              <div>
                <div className="py-4 px-5 relative" style={{
                  backgroundColor: '#fff9f0',
                  color: '#290f00',
                  border: '2px solid #290f00',
                  borderStyle: 'dashed'
                }}>
                  <h3 className="text-base font-medium mb-3 flex items-center" style={{color: '#290f00'}}>
                    <span className="mr-2">👋</span>
                    Hi Message
                  </h3>
                  <EditableText
                    value={personaCard.introMessage || ''}
                    onSave={(value) => updateField('introMessage', value)}
                    className="leading-relaxed"
                    placeholder="Double-click to add your introduction message to the class..."
                    multiline={true}
                  />
                  <p className="text-xs mt-3" style={{color: '#290f00', opacity: 0.7}}>
                    This is how you&apos;ll introduce yourself to your classmates. Double-click to edit or generate one using AI.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Show tip button when tip box is closed */}
            {!isTipBoxVisible && (
              <div className="fixed top-20 right-4">
                <button
                  onClick={() => setIsTipBoxVisible(true)}
                  className="w-10 h-10 bg-white border border-black rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-lg"
                  title="Show tips"
                  aria-label="Show tips"
                >
                  <span className="text-sm">💡</span>
                </button>
              </div>
            )}
          </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500">Click &quot;Switch to Persona Card View&quot; to generate your presentable persona card.</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-8 mt-12 border-t border-gray-200 text-center">
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
