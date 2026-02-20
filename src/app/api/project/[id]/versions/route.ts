/**
 * Project Versions API
 * 
 * GET: Retrieve version history
 * POST: Create a new version
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo - replace with database in production
const versionStore: Record<string, any[]> = {};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const versions = versionStore[projectId] || [];
    
    return NextResponse.json({
      versions: versions.sort((a, b) => b.version - a.version),
      currentVersion: versions.length > 0 ? versions[versions.length - 1].version : 0,
    });
  } catch (error) {
    console.error('Failed to fetch versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
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
    const { description, files, createdBy } = await req.json();

    if (!versionStore[projectId]) {
      versionStore[projectId] = [];
    }

    const newVersion = {
      id: Date.now().toString(),
      version: versionStore[projectId].length + 1,
      description,
      files,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    versionStore[projectId].push(newVersion);

    return NextResponse.json(newVersion);
  } catch (error) {
    console.error('Failed to create version:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
