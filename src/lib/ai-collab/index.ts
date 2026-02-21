/**
 * AI Collaboration Library
 * 
 * This module exports all AI collaboration-related hooks, contexts, and utilities.
 * Subagents can extend these or create their own implementations.
 */

export { AIProvider, useAIContext } from './AIContext';
export { useCodeSuggestions } from './useCodeSuggestions';
export { useProjectVersions } from './useProjectVersions';

// Export types
export type { 
  AIContextType,
  UseCodeSuggestionsOptions, 
  UseCodeSuggestionsReturn,
  UseProjectVersionsOptions,
  UseProjectVersionsReturn,
} from './types';

// Re-export component types for convenience
export type {
  ProjectFile,
  CodeSuggestion,
  ProjectVersion,
  ChatMessage,
} from '@/components/ai-collab/types';
