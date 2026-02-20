"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Wand2, FolderOpen, Code2, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface GeneratedProject {
  id: string;
  name: string;
  description: string;
  prompt: string;
  createdAt: string;
  path: string;
  status: "generating" | "completed" | "error";
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [projects, setProjects] = useState<GeneratedProject[]>([]);
  const [generationStatus, setGenerationStatus] = useState<string>("");

  const generateApp = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationStatus("Initializing generation...");

    const projectId = `proj_${Date.now()}`;
    const projectName = prompt.split(" ").slice(0, 3).join("_").toLowerCase().replace(/[^a-z0-9_]/g, "");
    
    const newProject: GeneratedProject = {
      id: projectId,
      name: projectName,
      description: prompt.slice(0, 100) + (prompt.length > 100 ? "..." : ""),
      prompt: prompt,
      createdAt: new Date().toISOString(),
      path: `/workspace/generated/${projectId}`,
      status: "generating",
    };

    setProjects((prev) => [newProject, ...prev]);

    try {
      setGenerationStatus("Sending request to AI...");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, projectId }),
      });

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const result = await response.json();
      
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, status: "completed", path: result.path }
            : p
        )
      );
      setGenerationStatus("Generation complete!");
      setPrompt("");
    } catch {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, status: "error" } : p
        )
      );
      setGenerationStatus("Generation failed. Check console for details.");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationStatus(""), 3000);
    }
  };

  const deleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Build Apps with AI, Own Your Code
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Describe what you want to build. We generate a complete Next.js app with 
            database, auth, and UI. You get clean, editable code — no vendor lock-in.
          </p>
        </div>

        {/* Prompt Interface */}
        <Card className="mb-8 border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-blue-400" />
              What do you want to build?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Example: Build a task management app with user authentication, where users can create projects, add tasks with deadlines, and mark them complete. Include a dashboard showing overdue tasks."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 resize-none"
              disabled={isGenerating}
            />
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                {generationStatus && (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {generationStatus}
                  </span>
                )}
              </div>
              <Button
                onClick={generateApp}
                disabled={!prompt.trim() || isGenerating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate App
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="font-semibold">Clean Code</h3>
              </div>
              <p className="text-sm text-slate-400">
                Generated code follows best practices. No proprietary frameworks.
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center">
                  <FolderOpen className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="font-semibold">Local Development</h3>
              </div>
              <p className="text-sm text-slate-400">
                Apps run locally. Iterate infinitely without per-prompt costs.
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="font-semibold">Deploy Anywhere</h3>
              </div>
              <p className="text-sm text-slate-400">
                Standard Next.js apps. Deploy to Vercel, Railway, or self-host.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Generated Projects */}
        {projects.length > 0 && (
          <>
            <Separator className="mb-6 bg-slate-800" />
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Generated Projects
              </h3>
              <div className="space-y-3">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="border-slate-800 bg-slate-900 hover:bg-slate-800/50 transition-colors"
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold truncate">
                              {project.name}
                            </h4>
                            <Badge
                              variant={
                                project.status === "completed"
                                  ? "default"
                                  : project.status === "error"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400 truncate">
                            {project.description}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            {new Date(project.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {project.status === "completed" && (
                            <Link
                              href={`/project/${project.id}`}
                              passHref
                            >
                              <Button variant="ghost" size="sm">
                                <Code2 className="w-4 h-4 mr-1" />
                                View Code
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProject(project.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
