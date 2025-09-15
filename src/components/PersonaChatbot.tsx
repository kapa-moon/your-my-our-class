'use client';

import { useState } from 'react';
import { getCurrentUserId } from '@/lib/auth-utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function PersonaChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your personal course assistant. I can help you understand how the course materials relate to your interests and background. Try asking me questions like 'What topics might I find most interesting?' or 'How does this course connect to my research interests?'",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userId = getCurrentUserId();
    if (!userId) {
      setError('Please log in to use the chatbot');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          userId: userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: data.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error('Chatbot error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style jsx>{`
        .chatbot-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }
        .chatbot-toggle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #000;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }
        .chatbot-toggle:hover {
          background: #333;
          transform: scale(1.05);
        }
        .chatbot-window {
          position: absolute;
          bottom: 70px;
          right: 0;
          width: 350px;
          height: 500px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .chatbot-header {
          background: #000;
          color: white;
          padding: 1rem;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .message {
          max-width: 80%;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        .message.user {
          background: #f0f0f0;
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }
        .message.assistant {
          background: #e8f4fd;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }
        .chatbot-input {
          border-top: 1px solid #eee;
          padding: 1rem;
          display: flex;
          gap: 0.5rem;
        }
        .chatbot-input input {
          flex: 1;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 0.75rem;
          font-size: 0.9rem;
          outline: none;
        }
        .chatbot-input input:focus {
          border-color: #000;
        }
        .chatbot-input button {
          background: #000;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1rem;
          cursor: pointer;
          font-size: 0.9rem;
          min-width: 60px;
        }
        .chatbot-input button:hover:not(:disabled) {
          background: #333;
        }
        .chatbot-input button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .error-message {
          background: #fee;
          color: #c00;
          padding: 0.5rem;
          font-size: 0.8rem;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }
        .loading-dots {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .loading-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #666;
          animation: loading 1.4s infinite ease-in-out;
        }
        .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes loading {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>

      <div className="chatbot-container">
        {isOpen && (
          <div className="chatbot-window">
            <div className="chatbot-header">
              <span>🤖 Course Assistant</span>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}
              >
                ×
              </button>
            </div>

            <div className="chatbot-messages">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`message ${message.role}`}
                >
                  {message.content}
                </div>
              ))}
              
              {isLoading && (
                <div className="message assistant">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>

            <div className="chatbot-input">
              {error && <div className="error-message">{error}</div>}
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your interests..."
                disabled={isLoading}
              />
              <button 
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
              >
                Send
              </button>
            </div>
          </div>
        )}

        <button 
          className="chatbot-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '×' : '🤖'}
        </button>
      </div>
    </>
  );
}
