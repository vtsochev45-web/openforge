/**
 * AI Collaboration Components
 * 
 * This module exports all AI collaboration-related components.
 * Subagents can extend or replace these components with their own implementations.
 */

export { AIChatSidebar } from './AIChatSidebar';
export { CodeSuggestionOverlay } from './CodeSuggestionOverlay';
export { VersionHistory } from './VersionHistory';

// Re-export types for convenience
export type { 
  ProjectFile, 
  CodeSuggestion, 
  ProjectVersion, 
  ChatMessage,
  AIChatSidebarProps 
} from './types';
