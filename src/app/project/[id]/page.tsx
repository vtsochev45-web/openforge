"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface ProjectFile {
  path: string;
  content: string;
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  prompt: string;
  createdAt: string;
  installCommand: string;
  runCommand: string;
  type: string;
  files: ProjectFile[];
}

export default function ProjectPage() {
  const params = useParams();
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // App execution state
  const [appStatus, setAppStatus] = useState<"idle" | "installing" | "starting" | "running" | "error">("idle");
  const [appUrl, setAppUrl] = useState<string | null>(null);
  const [appError, setAppError] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/project/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch project");
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchProject();
  }, [params.id]);

  // Check if app is already running on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/project/${params.id}/exec`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status" }),
        });
        const result = await res.json();
        if (result.running) {
          setAppStatus("running");
          setAppUrl(result.url);
        }
      } catch {
        // Ignore errors
      }
    };
    if (params.id) checkStatus();
  }, [params.id]);

  const startApp = async () => {
    setAppStatus("installing");
    setAppError("");
    
    try {
      const res = await fetch(`/api/project/${params.id}/exec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to start app");
      }
      
      if (result.status === "running") {
        setAppStatus("running");
        setAppUrl(result.url);
      } else {
        setAppStatus("starting");
        // Poll for status
        pollStatus();
      }
    } catch (err) {
      setAppStatus("error");
      setAppError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const pollStatus = async () => {
    const check = async () => {
      try {
        const res = await fetch(`/api/project/${params.id}/exec`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status" }),
        });
        const result = await res.json();
        
        if (result.running) {
          setAppStatus("running");
          setAppUrl(result.url);
          return true;
        }
      } catch {
        // Continue polling
      }
      return false;
    };

    // Poll for up to 60 seconds
    for (let i = 0; i < 60; i++) {
      if (await check()) return;
      await new Promise(r => setTimeout(r, 1000));
    }
    
    setAppStatus("error");
    setAppError("Timeout waiting for app to start");
  };

  const stopApp = async () => {
    try {
      await fetch(`/api/project/${params.id}/exec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      setAppStatus("idle");
      setAppUrl(null);
    } catch (err) {
      console.error("Failed to stop app:", err);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-8">Project not found</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-4 block">
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-2">{data.name}</h1>
        <p className="text-gray-400 mb-6">{data.description}</p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left column - Info */}
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Prompt</h2>
              <p className="text-gray-300 text-sm">{data.prompt}</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Commands</h2>
              <div className="space-y-2 text-sm">
                <code className="block bg-gray-900 p-2 rounded">{data.installCommand}</code>
                <code className="block bg-gray-900 p-2 rounded">{data.runCommand}</code>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Run App</h2>
              
              {appStatus === "idle" && (
                <button
                  onClick={startApp}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm w-full"
                >
                  ▶️ Start App
                </button>
              )}
              
              {appStatus === "installing" && (
                <div className="text-yellow-400 text-sm">
                  ⏳ Installing dependencies... (this may take a minute)
                </div>
              )}
              
              {appStatus === "starting" && (
                <div className="text-yellow-400 text-sm">
                  ⏳ Starting dev server...
                </div>
              )}
              
              {appStatus === "running" && appUrl && (
                <div className="space-y-2">
                  <div className="text-green-400 text-sm">✅ App is running!</div>
                  <a 
                    href={appUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm hover:underline block"
                  >
                    Open in new tab →
                  </a>
                  <button
                    onClick={stopApp}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm w-full"
                  >
                    ⏹️ Stop App
                  </button>
                </div>
              )}
              
              {appStatus === "error" && (
                <div className="space-y-2">
                  <div className="text-red-400 text-sm">❌ Error: {appError}</div>
                  <button
                    onClick={startApp}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm w-full"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Files ({data.files.length})</h2>
              <ul className="space-y-1 text-sm text-gray-300 max-h-48 overflow-y-auto">
                {data.files.map((file) => (
                  <li key={file.path} className="font-mono">{file.path}</li>
                ))}
              </ul>
            </div>

            <div className="text-xs text-gray-500">
              Created: {new Date(data.createdAt).toLocaleString()} | Type: {data.type}
            </div>
          </div>

          {/* Right column - Preview */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Preview</h2>
              {appUrl && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-blue-400 hover:underline"
                >
                  {showPreview ? "Hide" : "Show"}
                </button>
              )}
            </div>
            
            {appStatus === "running" && appUrl && showPreview ? (
              <iframe
                src={appUrl}
                className="w-full h-[600px] rounded border border-gray-700 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <div className="h-[600px] flex items-center justify-center text-gray-500 border border-gray-700 rounded border-dashed">
                {appStatus === "running" ? (
                  "Preview hidden"
                ) : (
                  <div className="text-center">
                    <div className="text-4xl mb-2">📦</div>
                    <div>Click "Start App" to run and preview</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
