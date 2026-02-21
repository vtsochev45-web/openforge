import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const WORKSPACE_DIR = process.env.VERCEL ? "/tmp/openforge" : "/home/tim/.openclaw/workspace";

async function readDirRecursive(
  dir: string,
  files: { path: string; content: string }[],
  basePath: string = ""
): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && entry.name !== ".next") {
          await readDirRecursive(fullPath, files, relativePath);
        }
      } else {
        if (entry.name !== "project.json") {
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            files.push({ path: relativePath, content });
          } catch {
            // Skip binary files
          }
        }
      }
    }
  } catch {
    // Directory might not exist
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const projectDir = path.join(WORKSPACE_DIR, "generated", projectId);

    const metadataPath = path.join(projectDir, "project.json");
    let metadata;
    try {
      const metadataContent = await fs.readFile(metadataPath, "utf-8");
      metadata = JSON.parse(metadataContent);
    } catch {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const files: { path: string; content: string }[] = [];
    await readDirRecursive(projectDir, files);

    return NextResponse.json({
      ...metadata,
      files: files.sort((a, b) => a.path.localeCompare(b.path)),
    });
  } catch (error) {
    console.error("Error loading project:", error);
    return NextResponse.json(
      { error: "Failed to load project" },
      { status: 500 }
    );
  }
}
