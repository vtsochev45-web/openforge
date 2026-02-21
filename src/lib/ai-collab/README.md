# AI Collaboration Integration

This module provides AI collaboration capabilities for OpenForge Phase 2.

## Overview

The AI collaboration system enables users to interact with an AI assistant directly within the project editor, receive code suggestions, and track changes through version history.

## Architecture

### Components (`src/components/ai-collab/`)

| Component | Purpose | Extension Point |
|-----------|---------|-----------------|
| `AIChatSidebar` | Chat interface with AI | ✅ Replaceable by ai-chat-ui subagent |
| `CodeSuggestionOverlay` | Shows code diff/accept/reject | ✅ Enhanceable by code-suggestion-system subagent |
| `VersionHistory` | Version timeline panel | ✅ Can be enhanced with better visualization |

### Hooks (`src/lib/ai-collab/`)

| Hook | Purpose |
|------|---------|
| `useAIContext` | Global state management for AI collaboration |
| `useCodeSuggestions` | Suggestion lifecycle management |
| `useProjectVersions` | Version history management |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ai-collab/chat` | POST | Process AI chat messages |
| `/api/project/[id]/versions` | GET/POST | Version history |
| `/api/project/[id]/restore` | POST | Restore to version |
| `/api/project/[id]/files` | GET/POST | File operations |

## Integration with Subagents

### For ai-chat-ui Subagent

The `AIChatSidebar` component in `src/components/ai-collab/AIChatSidebar.tsx` is designed to be replaced or enhanced:

```typescript
interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentFile: ProjectFile | null;
  selectedCode: { code: string; lineStart: number; lineEnd: number } | null;
  onSuggestion: (suggestion: CodeSuggestion) => void;
}
```

**To extend:**
1. Import the existing component and wrap it
2. Or replace the component entirely while maintaining the interface
3. Connect to your AI service in `/api/ai-collab/chat`

### For code-suggestion-system Subagent

The `CodeSuggestionOverlay` component displays suggestions:

```typescript
interface CodeSuggestionOverlayProps {
  suggestion: CodeSuggestion | null;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}
```

**To enhance:**
1. Replace the component with your diff visualization
2. Use the `useCodeSuggestions` hook for state management
3. Implement proper diff highlighting and code comparison

### For backend/AI service integration

The chat endpoint at `/api/ai-collab/chat/route.ts` expects:

**Request:**
```json
{
  "projectId": "string",
  "messages": [{"id": "", "role": "user", "content": "", "timestamp": ""}],
  "currentFile": {"path": "", "content": ""},
  "selectedCode": {"code": "", "lineStart": 1, "lineEnd": 5}
}
```

**Response:**
```json
{
  "message": "AI response text",
  "suggestion": {
    "id": "unique-id",
    "originalCode": "original",
    "suggestedCode": "suggested",
    "explanation": "Why this change",
    "startLine": 1,
    "endLine": 5,
    "applied": false
  }
}
```

## File Structure

```
src/
├── app/
│   ├── project/[id]/
│   │   └── page.tsx          # Main project page (integrated)
│   └── api/
│       ├── ai-collab/
│       │   ├── chat/route.ts
│       │   └── suggestions/[id]/accept/route.ts
│       └── project/[id]/
│           ├── versions/route.ts
│           ├── restore/route.ts
│           └── files/route.ts
├── components/
│   ├── ai-collab/
│   │   ├── AIChatSidebar.tsx
│   │   ├── CodeSuggestionOverlay.tsx
│   │   ├── VersionHistory.tsx
│   │   ├── types.ts
│   │   └── index.ts
│   └── ui/
│       ├── button.tsx
│       └── separator.tsx
└── lib/
    └── ai-collab/
        ├── AIContext.tsx
        ├── useCodeSuggestions.ts
        ├── useProjectVersions.ts
        ├── types.ts
        └── index.ts
```

## Usage in Project Page

```tsx
import { AIChatSidebar } from '@/components/ai-collab/AIChatSidebar';
import { CodeSuggestionOverlay } from '@/components/ai-collab/CodeSuggestionOverlay';
import { VersionHistory } from '@/components/ai-collab/VersionHistory';

// In your component:
<AIChatSidebar
  isOpen={aiSidebarOpen}
  onClose={() => setAiSidebarOpen(false)}
  projectId={data.id}
  currentFile={selectedFile}
  selectedCode={selectedCode}
  onSuggestion={handleSuggestion}
/>

<CodeSuggestionOverlay
  suggestion={activeSuggestion}
  onAccept={acceptSuggestion}
  onReject={rejectSuggestion}
  onClose={() => setActiveSuggestion(null)}
/>

<VersionHistory
  versions={versions}
  currentVersion={data.version || 0}
  onSelectVersion={handleVersionSelect}
  isOpen={versionPanelOpen}
  onClose={() => setVersionPanelOpen(false)}
/>
```

## Monaco Editor Integration

The project page includes Monaco Editor with an "Ask AI" context menu:

```typescript
editor.addAction({
  id: 'ask-ai',
  label: '🤖 Ask AI about this',
  run: (ed) => {
    const selection = ed.getSelection();
    // Open AI sidebar with selected code
  },
});
```

## Version Tracking

When files are saved:
- If saved by user → creates version with `createdBy: 'user'`
- If saved from AI suggestion → creates version with `createdBy: 'ai'`

Version metadata includes:
- Version number (auto-incrementing)
- Description of changes
- Complete file snapshot
- Timestamp
- Creator (user vs AI)
