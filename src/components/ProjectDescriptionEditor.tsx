'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';

interface ProjectDescriptionEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  isEditing: boolean;
  isSaving?: boolean;
}

export default function ProjectDescriptionEditor({ 
  initialContent = '', 
  onSave, 
  onCancel, 
  isEditing,
  isSaving = false
}: ProjectDescriptionEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Strike,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  const handleSave = () => {
    if (editor) {
      onSave(editor.getHTML());
    }
  };

  if (!isEditing) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        .editor-container {
          border: 2px solid #ddd;
          border-radius: 8px;
          background: white;
        }
        .toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px;
          background: #f8f9fa;
          border-bottom: 1px solid #ddd;
          border-radius: 8px 8px 0 0;
        }
        .toolbar-button {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .toolbar-button:hover {
          background: #f0f0f0;
          border-color: #999;
        }
        .toolbar-button.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        .editor-content {
          border-radius: 0 0 8px 8px;
          border-top: none;
        }
        .editor-content .ProseMirror {
          outline: none;
          padding: 16px;
          min-height: 200px;
        }
        .editor-content .ProseMirror ul {
          list-style-type: disc;
          margin-left: 1.5em;
          padding-left: 0;
        }
        .editor-content .ProseMirror ol {
          list-style-type: decimal;
          margin-left: 1.5em;
          padding-left: 0;
        }
        .editor-content .ProseMirror li {
          margin-bottom: 0.5em;
        }
        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }
        .save-button {
          padding: 10px 20px;
          background: white;
          border: 2px solid #f97316;
          color: #f97316;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .save-button:hover:not(:disabled) {
          background: #f97316;
          color: white;
        }
        .save-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .cancel-button {
          padding: 10px 20px;
          background: white;
          border: 1px solid #666;
          color: #666;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cancel-button:hover {
          background: #f5f5f5;
          border-color: #333;
          color: #333;
        }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #f97316;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="editor-container">
        {/* Toolbar */}
        <div className="toolbar">
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`toolbar-button ${editor?.isActive('bold') ? 'active' : ''}`}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`toolbar-button ${editor?.isActive('italic') ? 'active' : ''}`}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`toolbar-button ${editor?.isActive('underline') ? 'active' : ''}`}
          >
            <u>U</u>
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            className={`toolbar-button ${editor?.isActive('strike') ? 'active' : ''}`}
          >
            <s>S</s>
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`toolbar-button ${editor?.isActive('bulletList') ? 'active' : ''}`}
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`toolbar-button ${editor?.isActive('orderedList') ? 'active' : ''}`}
          >
            1. List
          </button>
        </div>

        {/* Editor Content */}
        <div className="editor-content">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="button-group">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="save-button"
        >
          {isSaving ? (
            <>
              <div className="spinner"></div>
              Saving...
            </>
          ) : (
            'Save'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="cancel-button"
        >
          Cancel
        </button>
      </div>
    </>
  );
}
