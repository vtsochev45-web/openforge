/**
 * AI Collaboration Hook Types
 * 
 * Type definitions for AI collaboration hooks and utilities.
 */

import { ProjectFile, CodeSuggestion, ProjectVersion } from '@/components/ai-collab/types';

export interface AIContextType {
  currentFile: ProjectFile | null;
  setCurrentFile: (file: ProjectFile | null) => void;
  selectedCode: { code: string; lineStart: number; lineEnd: number } | null;
  setSelectedCode: (code: { code: string; lineStart: number; lineEnd: number } | null) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  pendingSuggestion: CodeSuggestion | null;
  setPendingSuggestion: (suggestion: CodeSuggestion | null) => void;
  clearContext: () => void;
}

export interface UseCodeSuggestionsOptions {
  projectId: string;
  onSuggestionAccepted?: (suggestion: CodeSuggestion) => void;
  onSuggestionRejected?: (suggestion: CodeSuggestion) => void;
}

export interface UseCodeSuggestionsReturn {
  pendingSuggestion: CodeSuggestion | null;
  suggestionHistory: CodeSuggestion[];
  showSuggestion: (suggestion: CodeSuggestion) => void;
  acceptSuggestion: () => Promise<void>;
  rejectSuggestion: () => void;
  clearSuggestion: () => void;
  applySuggestionToContent: (content: string, suggestion: CodeSuggestion) => string;
}

export interface UseProjectVersionsOptions {
  projectId: string;
}

export interface UseProjectVersionsReturn {
  versions: ProjectVersion[];
  currentVersion: number;
  loading: boolean;
  error: string | null;
  refreshVersions: () => Promise<void>;
  createVersion: (description: string, files: ProjectFile[], createdBy: 'user' | 'ai') => Promise<ProjectVersion | null>;
  restoreVersion: (versionId: string) => Promise<ProjectVersion | null>;
  getVersion: (versionId: string) => ProjectVersion | undefined;
}