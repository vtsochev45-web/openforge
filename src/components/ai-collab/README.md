# AI Collaboration Components

This directory contains components for AI-powered collaboration features in OpenForge.

## Components

### AIChatSidebar

A slide-out chat interface for AI collaboration on projects.

#### Features

- **Slide-out sidebar**: Smooth animation, responsive design
- **Chat history**: Maintains conversation context
- **Code suggestions**: Displays code blocks with syntax highlighting
- **Apply buttons**: One-click application of code changes
- **Model selector**: Switch between GPT-4, Claude, and Gemini
- **File context**: Shows which files are in context

#### Usage

```tsx
import { AIChatSidebar } from "@/components/ai-collab";

export default function ProjectPage() {
  return (
    <div>
      {/* Your project content */}
      <AIChatSidebar
        projectId="proj_123"
        projectFiles={["/src/app/page.tsx", "/src/lib/utils.ts"]}
        onApplySuggestion={(suggestion) => {
          // Handle applying code changes
          console.log("Applying to:", suggestion.filePath);
        }}
      />
    </div>
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `projectId` | `string` | The project identifier |
| `projectFiles` | `string[]` | List of files in context |
| `onApplySuggestion` | `(suggestion: CodeSuggestion) => void` | Callback when user applies code |
| `className` | `string` | Additional CSS classes |

#### Types

```typescript
interface CodeSuggestion {
  id: string;
  filePath: string;
  code: string;
  language: string;
  description?: string;
}

type AIModel = "gpt-4" | "claude" | "gemini";
```

## Integration with Project Page

The AIChatSidebar is designed to integrate seamlessly with the project page:

1. It receives the project ID and file list from the project context
2. Code suggestions can be applied directly to the project files
3. The model selector allows users to choose their preferred AI
4. All conversations are scoped to the specific project
