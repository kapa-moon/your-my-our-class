'use client';

import { useState } from 'react';

interface ProjectType {
  value: string;
  label: string;
  description: string;
  chipClass: string;
}

interface ProjectTypeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const projectTypes: ProjectType[] = [
  {
    value: 'review',
    label: 'Review Track',
    description: 'Review in a focused area',
    chipClass: 'lit-review-chip'
  },
  {
    value: 'empirical',
    label: 'Empirical Track',
    description: 'Design and implement a novel extension or application of models we read about',
    chipClass: 'project-chip'
  },
  {
    value: 'theory',
    label: 'Theory Track',
    description: 'New or improved concepts, definitions, models, principles, or frameworks',
    chipClass: 'theory-chip'
  },
  {
    value: 'reproducibility',
    label: 'Reproducibility Track',
    description: 'Reproduce experimental (simulation/evaluation) results from papers we read',
    chipClass: 'reproducibility-chip'
  },
  {
    value: 'others',
    label: 'Others',
    description: 'You can specify later on',
    chipClass: 'others-chip'
  }
];

export default function ProjectTypeDropdown({ value, onChange, disabled }: ProjectTypeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedType = projectTypes.find(type => type.value === value);

  const handleSelect = (typeValue: string) => {
    onChange(typeValue);
    setIsOpen(false);
  };

  return (
    <>
      <style jsx>{`
        .track-chip {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.85em;
          text-align: center;
          min-width: 110px;
          flex-shrink: 0;
        }
        .lit-review-chip {
          color: #8b0088;
          background-color: rgba(255, 173, 255, 0.3);
        }
        .reproducibility-chip {
          color: #006b00;
          background-color: rgba(173, 255, 173, 0.3);
        }
        .project-chip {
          color: #0066cc;
          background-color: rgba(173, 214, 255, 0.3);
        }
        .theory-chip {
          color: #cc6600;
          background-color: rgba(255, 204, 153, 0.3);
        }
        .others-chip {
          color: #666666;
          background-color: rgba(204, 204, 204, 0.3);
        }
        .dropdown-container {
          position: relative;
          display: inline-block;
          width: 100%;
        }
        .dropdown-button {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
          transition: all 0.2s;
        }
        .dropdown-button:hover {
          border-color: #999;
        }
        .dropdown-button.open {
          border-color: #333;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }
        .dropdown-button.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #333;
          border-top: none;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          z-index: 1000;
          max-height: 300px;
          overflow-y: auto;
        }
        .dropdown-item {
          padding: 10px 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background-color 0.2s;
          border-bottom: 1px solid #eee;
          gap: 10px;
        }
        .dropdown-item:last-child {
          border-bottom: none;
        }
        .dropdown-item:hover {
          background-color: #f5f5f5;
        }
        .dropdown-item-content {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }
        .dropdown-item-description {
          font-size: 13px;
          color: #666;
          line-height: 1.3;
          flex: 1;
          min-width: 0;
        }
        .dropdown-arrow {
          transition: transform 0.2s;
        }
        .dropdown-arrow.open {
          transform: rotate(180deg);
        }
        .placeholder-text {
          color: #999;
        }
      `}</style>

      <div className="dropdown-container">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">Project Type:</span>
          {!value && (
            <span className="text-xs text-gray-600" style={{ textDecoration: 'underline', textDecorationColor: '#f97316' }}>
              Please choose a project type
            </span>
          )}
        </div>
        
        <button
          type="button"
          className={`dropdown-button ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <div className="flex items-center">
            {selectedType ? (
              <>
                <div className={`track-chip ${selectedType.chipClass}`}>
                  {selectedType.label}
                </div>
              </>
            ) : (
              <span className="placeholder-text">Select a project type...</span>
            )}
          </div>
          <div className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>
            ▼
          </div>
        </button>

        {isOpen && (
          <div className="dropdown-menu">
            {projectTypes.map((type) => (
              <div
                key={type.value}
                className="dropdown-item"
                onClick={() => handleSelect(type.value)}
              >
                <div className="dropdown-item-content">
                  <div className={`track-chip ${type.chipClass}`}>
                    {type.label}
                  </div>
                  <div className="dropdown-item-description">
                    {type.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
