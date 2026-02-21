'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

interface AIContextType {
  // Current file context
  currentFile: ProjectFile | null;
  setCurrentFile: (file: ProjectFile | null) => void;
  
  // Selected code for AI context
  selectedCode: { code: string; lineStart: number; lineEnd: number } | null;
  setSelectedCode: (code: { code: string; lineStart: number; lineEnd: number } | null) => void;
  
  // Chat state
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  
  // Suggestions
  pendingSuggestion: CodeSuggestion | null;
  setPendingSuggestion: (suggestion: CodeSuggestion | null) => void;
  
  // Clear context (useful when switching files)
  clearContext: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

interface AIProviderProps {
  children: ReactNode;
}

/**
 * AIProvider - Context provider for AI collaboration state
 * 
 * Manages the global state for AI collaboration including:
 * - Current file context
 * - Selected code for AI context
 * - Chat sidebar visibility
 * - Pending code suggestions
 */
export function AIProvider({ children }: AIProviderProps) {
  const [currentFile, setCurrentFile] = useState<ProjectFile | null>(null);
  const [selectedCode, setSelectedCode] = useState<{ code: string; lineStart: number; lineEnd: number } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<CodeSuggestion | null>(null);

  const clearContext = useCallback(() => {
    setSelectedCode(null);
    setPendingSuggestion(null);
  }, []);

  return (
    <AIContext.Provider value={{
      currentFile,
      setCurrentFile,
      selectedCode,
      setSelectedCode,
      isChatOpen,
      setIsChatOpen,
      pendingSuggestion,
      setPendingSuggestion,
      clearContext,
    }}>
      {children}
    </AIContext.Provider>
  );
}

/**
 * useAIContext - Hook to access AI collaboration context
 * 
 * @throws Error if used outside of AIProvider
 */
export function useAIContext() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAIContext must be used within an AIProvider');
  }
  return context;
}
