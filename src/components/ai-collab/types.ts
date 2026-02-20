/**
 * AI Collaboration Types
 * 
 * Shared types for AI collaboration components.
 * These types are used across the AI collaboration system.
 */

export interface ProjectFile {
  path: string;
  content: string;
}

export interface CodeSuggestion {
  id: string;
  originalCode: string;
  suggestedCode: string;
  explanation: string;
  startLine: number;
  endLine: number;
  applied: boolean;
}

export interface ProjectVersion {
  id: string;
  version: number;
  description: string;
  files: ProjectFile[];
  createdAt: string;
  createdBy: 'user' | 'ai';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentFile: ProjectFile | null;
  selectedCode: { code: string; lineStart: number; lineEnd: number } | null;
  onSuggestion: (suggestion: CodeSuggestion) => void;
}

export interface CodeSuggestionOverlayProps {
  suggestion: CodeSuggestion | null;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

export interface VersionHistoryProps {
  versions: ProjectVersion[];
  currentVersion: number;
  onSelectVersion: (version: ProjectVersion) => void;
  isOpen: boolean;
  onClose: () => void;
}
