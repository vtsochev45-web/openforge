/**
 * Project Files API
 * 
 * GET: Get file contents
 * POST: Update file contents (creates a new version)
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Helper to get project path
async function getProjectPath(projectId: string): Promise<string | null> {
  try {
    // Query the main server for project location
    const result = await execAsync(`openclaw project list --json`);
    const projects = JSON.parse(result.stdout);
    const project = projects.find((p: { id: string; path?: string }) => p.id === projectId);
    return project?.path || null;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path required' },
        { status: 400 }
      );
    }

    const projectPath = await getProjectPath(projectId);
    if (!projectPath) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const fullPath = path.join(projectPath, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to read file:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const { path: filePath, content, source = 'user', suggestionId } = await req.json();

    if (!filePath || content === undefined) {
      return NextResponse.json(
        { error: 'File path and content required' },
        { status: 400 }
      );
    }

    const projectPath = await getProjectPath(projectId);
    if (!projectPath) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const fullPath = path.join(projectPath, filePath);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, content, 'utf-8');

    return NextResponse.json({
      success: true,
      path: filePath,
      source,
      suggestionId,
    });
  } catch (error) {
    console.error('Failed to write file:', error);
    return NextResponse.json(
      { error: 'Failed to write file' },
      { status: 500 }
    );
  }
}
