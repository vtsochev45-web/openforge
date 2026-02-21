"use client";

import { Sparkles, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CodeSuggestion {
  id: string;
  originalCode: string;
  suggestedCode: string;
  explanation: string;
  startLine: number;
  endLine: number;
  applied: boolean;
}

interface CodeSuggestionOverlayProps {
  suggestion: CodeSuggestion | null;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

/**
 * CodeSuggestionOverlay - Displays AI Code Suggestions
 * 
 * This component shows the difference between original and suggested code,
 * allowing the user to accept or reject changes.
 * 
 * PLACEHOLDER: This is a base implementation that the code-suggestion-system
 * subagent should extend with their own diff viewing and comparison logic.
 */
export function CodeSuggestionOverlay({
  suggestion,
  onAccept,
  onReject,
  onClose,
}: CodeSuggestionOverlayProps) {
  if (!suggestion) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">AI Code Suggestion</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          <p className="text-gray-300 mb-4">{suggestion.explanation}</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Original</h4>
              <pre className="bg-gray-800 p-3 rounded text-sm text-gray-300 overflow-auto max-h-64">
                <code>{suggestion.originalCode}</code>
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-medium text-purple-400 mb-2">Suggested</h4>
              <pre className="bg-gray-800 p-3 rounded text-sm text-gray-300 overflow-auto max-h-64 border border-purple-500/30">
                <code>{suggestion.suggestedCode}</code>
              </pre>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex justify-end gap-3">
          <Button variant="outline" onClick={onReject} className="border-red-500/50 text-red-400 hover:bg-red-500/10">
            <X className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button onClick={onAccept} className="bg-green-600 hover:bg-green-700">
            <Check className="w-4 h-4 mr-2" />
            Accept Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
