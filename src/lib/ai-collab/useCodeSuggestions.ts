'use client';

import { useState, useCallback } from 'react';

interface CodeSuggestion {
  id: string;
  originalCode: string;
  suggestedCode: string;
  explanation: string;
  startLine: number;
  endLine: number;
  applied: boolean;
}

interface UseCodeSuggestionsOptions {
  projectId: string;
  onSuggestionAccepted?: (suggestion: CodeSuggestion) => void;
  onSuggestionRejected?: (suggestion: CodeSuggestion) => void;
}

interface UseCodeSuggestionsReturn {
  /** The currently pending suggestion waiting for user action */
  pendingSuggestion: CodeSuggestion | null;
  
  /** All suggestions made during this session */
  suggestionHistory: CodeSuggestion[];
  
  /** Show a new suggestion to the user */
  showSuggestion: (suggestion: CodeSuggestion) => void;
  
  /** Accept the current pending suggestion */
  acceptSuggestion: () => Promise<void>;
  
  /** Reject the current pending suggestion */
  rejectSuggestion: () => void;
  
  /** Clear the pending suggestion without action */
  clearSuggestion: () => void;
  
  /** Apply a suggestion directly to file content */
  applySuggestionToContent: (content: string, suggestion: CodeSuggestion) => string;
}

/**
 * useCodeSuggestions - Hook for managing AI code suggestions
 * 
 * Manages the lifecycle of code suggestions:
 * - Receiving suggestions from AI
 * - Displaying them to the user
 * - Accepting/rejecting suggestions
 * - Applying accepted suggestions to file content
 * 
 * This hook works with the code-suggestion-system subagent to handle
 * the actual suggestion generation logic.
 */
export function useCodeSuggestions(options: UseCodeSuggestionsOptions): UseCodeSuggestionsReturn {
  const { projectId, onSuggestionAccepted, onSuggestionRejected } = options;
  
  const [pendingSuggestion, setPendingSuggestion] = useState<CodeSuggestion | null>(null);
  const [suggestionHistory, setSuggestionHistory] = useState<CodeSuggestion[]>([]);

  const showSuggestion = useCallback((suggestion: CodeSuggestion) => {
    setPendingSuggestion(suggestion);
  }, []);

  const acceptSuggestion = useCallback(async () => {
    if (!pendingSuggestion) return;

    try {
      // Notify the API that this suggestion was accepted
      await fetch(`/api/ai-collab/suggestions/${pendingSuggestion.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const acceptedSuggestion = { ...pendingSuggestion, applied: true };
      setSuggestionHistory(prev => [...prev, acceptedSuggestion]);
      onSuggestionAccepted?.(acceptedSuggestion);
      setPendingSuggestion(null);
    } catch (err) {
      console.error('Failed to accept suggestion:', err);
    }
  }, [pendingSuggestion, projectId, onSuggestionAccepted]);

  const rejectSuggestion = useCallback(() => {
    if (!pendingSuggestion) return;

    try {
      fetch(`/api/ai-collab/suggestions/${pendingSuggestion.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
    } catch (err) {
      // Don't block UI on analytics failure
      console.error('Failed to log rejection:', err);
    }

    onSuggestionRejected?.(pendingSuggestion);
    setSuggestionHistory(prev => [...prev, { ...pendingSuggestion, applied: false }]);
    setPendingSuggestion(null);
  }, [pendingSuggestion, projectId, onSuggestionRejected]);

  const clearSuggestion = useCallback(() => {
    setPendingSuggestion(null);
  }, []);

  /**
   * Apply a suggestion to file content
   * Replaces the original code lines with the suggested code
   */
  const applySuggestionToContent = useCallback((content: string, suggestion: CodeSuggestion): string => {
    const lines = content.split('\n');
    const { startLine, endLine, suggestedCode } = suggestion;
    
    // Convert to 0-based index
    const startIdx = startLine - 1;
    const endIdx = endLine - 1;
    
    // Replace the lines
    const newLines = [
      ...lines.slice(0, startIdx),
      suggestedCode,
      ...lines.slice(endIdx + 1),
    ];
    
    return newLines.join('\n');
  }, []);

  return {
    pendingSuggestion,
    suggestionHistory,
    showSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestion,
    applySuggestionToContent,
  };
}
