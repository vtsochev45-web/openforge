'use client';

import { useState, useEffect, useCallback } from 'react';

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

interface UseProjectVersionsOptions {
  projectId: string;
}

interface UseProjectVersionsReturn {
  /** All versions of the project, sorted newest first */
  versions: ProjectVersion[];
  
  /** Current version number */
  currentVersion: number;
  
  /** Loading state */
  loading: boolean;
  
  /** Error if any */
  error: string | null;
  
  /** Refresh versions from server */
  refreshVersions: () => Promise<void>;
  
  /** Create a new version */
  createVersion: (description: string, files: ProjectFile[], createdBy: 'user' | 'ai') => Promise<ProjectVersion | null>;
  
  /** Restore to a specific version */
  restoreVersion: (versionId: string) => Promise<ProjectVersion | null>;
  
  /** Get a specific version by ID */
  getVersion: (versionId: string) => ProjectVersion | undefined;
}

/**
 * useProjectVersions - Hook for managing project version history
 * 
 * Handles version tracking for AI and user changes:
 * - Fetching version history
 * - Creating new versions on changes
 * - Restoring to previous versions
 * - Tracking who made each change (user vs AI)
 */
export function useProjectVersions(options: UseProjectVersionsOptions): UseProjectVersionsReturn {
  const { projectId } = options;
  
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/project/${projectId}/versions`);
      if (!res.ok) throw new Error('Failed to fetch versions');
      const data = await res.json();
      setVersions(data.versions || []);
      setCurrentVersion(data.currentVersion || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const refreshVersions = useCallback(async () => {
    setLoading(true);
    await fetchVersions();
  }, [fetchVersions]);

  const createVersion = useCallback(async (
    description: string, 
    files: ProjectFile[], 
    createdBy: 'user' | 'ai'
  ): Promise<ProjectVersion | null> => {
    try {
      const res = await fetch(`/api/project/${projectId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, files, createdBy }),
      });

      if (!res.ok) throw new Error('Failed to create version');
      
      const newVersion = await res.json();
      setVersions(prev => [newVersion, ...prev]);
      setCurrentVersion(newVersion.version);
      return newVersion;
    } catch (err) {
      console.error('Failed to create version:', err);
      return null;
    }
  }, [projectId]);

  const restoreVersion = useCallback(async (versionId: string): Promise<ProjectVersion | null> => {
    try {
      const res = await fetch(`/api/project/${projectId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });

      if (!res.ok) throw new Error('Failed to restore version');
      
      const restoredVersion = await res.json();
      
      // Refresh versions after restore
      await fetchVersions();
      
      return restoredVersion;
    } catch (err) {
      console.error('Failed to restore version:', err);
      return null;
    }
  }, [projectId, fetchVersions]);

  const getVersion = useCallback((versionId: string): ProjectVersion | undefined => {
    return versions.find(v => v.id === versionId);
  }, [versions]);

  return {
    versions,
    currentVersion,
    loading,
    error,
    refreshVersions,
    createVersion,
    restoreVersion,
    getVersion,
  };
}
