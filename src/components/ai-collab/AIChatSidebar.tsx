"use client";

import { useEffect, useState, useRef } from "react";
import { Bot, X, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProjectFile {
  path: string;
  content: string;
}

interface CodeSuggestion {
  id: string;
  originalCode: string;
  suggestedCode: string;
  explanation: string;
  startLine: number;
  endLine: number;
  applied: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentFile: ProjectFile | null;
  selectedCode: { code: string; lineStart: number; lineEnd: number } | null;
  onSuggestion: (suggestion: CodeSuggestion) => void;
}

/**
 * AIChatSidebar - AI Chat Interface Component
 * 
 * This is the main entry point for the ai-chat-ui subagent integration.
 * It provides a chat interface for users to interact with the AI assistant
 * and receive code suggestions.
 * 
 * PLACEHOLDER: This is a base implementation that the ai-chat-ui subagent
 * should extend or replace with their own implementation.
 */
export function AIChatSidebar({
  isOpen,
  onClose,
  projectId,
  currentFile,
  selectedCode,
  onSuggestion,
}: AIChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-collab/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          messages: [...messages, userMessage],
          currentFile,
          selectedCode,
        }),
      });

      const data = await res.json();
      
      if (data.suggestion) {
        onSuggestion(data.suggestion);
      }

      if (data.message) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      console.error('AI chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white">AI Assistant</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ask me anything about your code!</p>
            <p className="text-sm mt-2">
              I can help you modify files, explain code, or suggest improvements.
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "p-3 rounded-lg max-w-[90%]",
              msg.role === 'user' 
                ? "bg-blue-600 ml-auto text-white" 
                : "bg-gray-800 text-gray-200"
            )}
          >
            <p className="text-sm">{msg.content}</p>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="animate-pulse">AI is thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800">
        {selectedCode && (
          <div className="mb-2 p-2 bg-gray-800 rounded text-xs text-gray-400">
            Context: {selectedCode.code.slice(0, 50)}...
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask AI about your code..."
            className="flex-1 bg-gray-800 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
