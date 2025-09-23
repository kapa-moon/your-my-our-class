'use client';

import { useState, useEffect } from 'react';
import ProjectTypeDropdown from './ProjectTypeDropdown';
import ProjectDescriptionEditor from './ProjectDescriptionEditor';

interface ProjectSectionProps {
  userId: number;
}

interface ProjectData {
  id?: number;
  projectType: string;
  projectDescription: string;
  version?: number;
}

export default function ProjectSection({ userId }: ProjectSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [projectType, setProjectType] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProject, setHasProject] = useState(false);

  // Load existing project data and survey data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Try to load existing project first
        const projectResponse = await fetch(`/api/student-projects?userId=${userId}`);
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          if (projectData.success && projectData.data) {
            setProjectType(projectData.data.projectType);
            setProjectDescription(projectData.data.projectDescription);
            setHasProject(true);
            setLoading(false);
            return;
          }
        }

        // If no project exists, load survey data as initial content
        const surveyResponse = await fetch(`/api/survey?userId=${userId}`);
        if (surveyResponse.ok) {
          const surveyData = await surveyResponse.json();
          if (surveyData.success && surveyData.data?.classGoals) {
            setProjectDescription(surveyData.data.classGoals);
          }
        }
        
        setHasProject(false);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadData();
    }
  }, [userId]);

  const handleSave = async (description: string) => {
    if (!projectType) {
      alert('Please select a project type before saving.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/student-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          projectType,
          projectDescription: description
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProjectDescription(description);
        setIsEditing(false);
        setHasProject(true);
        console.log(`Project saved as version ${data.version}`);
      } else {
        alert('Failed to save project. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="project-section-loading">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          Loading project data...
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .project-section {
          margin: 2rem 0;
          padding: 2rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fafafa;
        }
        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }
        .project-title {
          font-size: 1.4em;
          font-weight: 600;
          margin: 0;
          color: #222;
        }
        .edit-button {
          padding: 8px 16px;
          background: white;
          border: 1px solid #333;
          color: #333;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .edit-button:hover {
          background: #f5f5f5;
        }
        .description-container {
          margin-top: 1.5rem;
        }
        .description-label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #333;
          display: block;
        }
        .description-display {
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 1rem;
          min-height: 100px;
          font-family: inherit;
          line-height: 1.6;
        }
        .description-display.empty {
          color: #999;
          font-style: italic;
        }
        .project-status {
          font-size: 0.9em;
          color: #666;
          margin-top: 0.5rem;
        }
      `}</style>

      <div className="project-section">
        <div className="project-header">
          <h4 className="project-title">My Research Project</h4>
          {!isEditing && hasProject && (
            <button
              onClick={handleEdit}
              className="edit-button"
            >
              Edit
            </button>
          )}
        </div>

        {/* Project Type Dropdown */}
        <ProjectTypeDropdown
          value={projectType}
          onChange={setProjectType}
          disabled={!isEditing && hasProject}
        />

        {/* Project Description */}
        <div className="description-container">
          <label className="description-label">
            Project Description:
          </label>

          {isEditing ? (
            <ProjectDescriptionEditor
              initialContent={projectDescription}
              onSave={handleSave}
              onCancel={handleCancel}
              isEditing={isEditing}
              isSaving={saving}
            />
          ) : (
            <>
              <div 
                className={`description-display ${!projectDescription ? 'empty' : ''}`}
                dangerouslySetInnerHTML={{
                  __html: projectDescription || 'No project description yet. Click "Edit" to add your project description.'
                }}
              />
              
              {!hasProject && (
                <div className="project-status">
                  💡 Your initial content is loaded from your survey responses. Click "Edit" to start customizing your project.
                </div>
              )}
              
              {!isEditing && !hasProject && projectDescription && (
                <button
                  onClick={handleEdit}
                  className="edit-button"
                  style={{ marginTop: '1rem' }}
                >
                  Start Editing Project
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
