"use client";

import { History, X, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectFile {
  path: string;
  content: string;
}

interface ProjectVersion {
  id: string;
  version: number;
  description: string;
  files: ProjectFile[];
  createdAt: string;
  createdBy: 'user' | 'ai';
}

interface VersionHistoryProps {
  versions: ProjectVersion[];
  currentVersion: number;
  onSelectVersion: (version: ProjectVersion) => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * VersionHistory - Version History Panel
 * 
 * Displays the version history of the project, including AI-generated
 * and user-made changes. Allows restoring to previous versions.
 * 
 * EXTENSION POINT: This component can be enhanced with:
 * - Diff visualization between versions
 * - Branch/merge visualization
 * - Detailed change summaries
 */
export function VersionHistory({
  versions,
  currentVersion,
  onSelectVersion,
  isOpen,
  onClose,
}: VersionHistoryProps) {
  if (!isOpen) return null;

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Version History</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {versions.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No versions yet</p>
            <p className="text-sm mt-2">
              AI changes will be tracked automatically.
            </p>
          </div>
        )}
        
        {versions.map((version) => (
          <button
            key={version.id}
            onClick={() => onSelectVersion(version)}
            className={cn(
              "w-full text-left p-3 rounded-lg border transition-colors",
              version.version === currentVersion
                ? "bg-blue-500/20 border-blue-500/50"
                : "bg-gray-800 border-gray-700 hover:border-gray-600"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">
                Version {version.version}
              </span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded",
                version.createdBy === 'ai' 
                  ? "bg-purple-500/20 text-purple-400" 
                  : "bg-green-500/20 text-green-400"
              )}>
                {version.createdBy === 'ai' ? 'AI' : 'User'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-1">{version.description}</p>
            <p className="text-xs text-gray-500">
              {new Date(version.createdAt).toLocaleString()}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
