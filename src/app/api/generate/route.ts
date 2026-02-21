import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const WORKSPACE_DIR = process.env.VERCEL ? "/tmp/openforge" : "/home/tim/.openclaw/workspace";

interface FileStructure {
  path: string;
  content: string;
}

interface GeneratedApp {
  name: string;
  description: string;
  files: FileStructure[];
  installCommand: string;
  runCommand: string;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, projectId, fullStack = true } = await req.json();

    if (!prompt || !projectId) {
      return NextResponse.json(
        { error: "Missing prompt or projectId" },
        { status: 400 }
      );
    }

    const projectDir = path.join(WORKSPACE_DIR, "generated", projectId);
    await fs.mkdir(projectDir, { recursive: true });

    const generatedApp = fullStack 
      ? await generateFullStackApp(prompt, projectId)
      : await generateFrontendApp(prompt, projectId);

    for (const file of generatedApp.files) {
      const filePath = path.join(projectDir, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file.content, "utf-8");
    }

    await fs.writeFile(
      path.join(projectDir, "project.json"),
      JSON.stringify(
        {
          id: projectId,
          name: generatedApp.name,
          description: generatedApp.description,
          prompt,
          createdAt: new Date().toISOString(),
          installCommand: generatedApp.installCommand,
          runCommand: generatedApp.runCommand,
          type: fullStack ? "fullstack" : "frontend"
        },
        null,
        2
      ),
      "utf-8"
    );

    return NextResponse.json({
      success: true,
      path: projectDir,
      project: generatedApp,
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate app", details: String(error) },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateFullStackApp(prompt: string, _projectId: string): Promise<GeneratedApp> {
  const systemPrompt = `You are an expert full-stack developer. Generate a complete FULL-STACK Next.js 14 application with database, auth, and API routes.

TECH STACK:
- Next.js 14 with App Router
- React 18 + TypeScript
- Tailwind CSS for styling
- Prisma ORM with SQLite database
- NextAuth.js for authentication
- bcrypt for password hashing
- Server Actions for mutations

CRITICAL RULES:
1. Generate REAL, WORKING code - no placeholders, no "TODO" comments
2. ALL features must be fully implemented
3. Database models must be complete with proper relations
4. API routes must handle CRUD operations
5. Auth must work with registration/login/logout
6. Use Server Actions for form submissions
7. Include proper error handling

REQUIRED FILES TO GENERATE:
1. package.json - with ALL dependencies
2. prisma/schema.prisma - complete database schema
3. src/lib/auth.ts - NextAuth configuration
4. src/app/api/auth/[...nextauth]/route.ts - Auth API route
5. src/app/api/models/route.ts - REST API endpoints
6. src/app/actions.ts - Server Actions for forms
7. src/app/page.tsx - Main page with all features
8. src/app/layout.tsx - Root layout with auth provider
9. src/app/globals.css - Tailwind + custom styles
10. src/middleware.ts - Auth protection
11. next.config.js, tsconfig.json, tailwind.config.ts
12. README.md - Setup instructions

OUTPUT FORMAT - Respond with ONLY a JSON object:
{
  "name": "app-name",
  "description": "Brief description",
  "files": [{ "path": "...", "content": "..." }],
  "installCommand": "npm install",
  "runCommand": "npm run dev"
}`;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "OpenForge",
      },
      body: JSON.stringify({
        model: "openrouter/google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Build this full-stack app: ${prompt}` },
        ],
        temperature: 0.7,
        max_tokens: 12000,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No content in AI response");
  }

  let jsonStr = content;
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return parsed as GeneratedApp;
  } catch {
    console.error("Failed to parse AI response, using fallback");
    return createFallbackFullStackApp(prompt);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateFrontendApp(prompt: string, _projectId: string): Promise<GeneratedApp> {
  const systemPrompt = `You are an expert frontend developer. Generate a complete React/Next.js frontend application.

TECH STACK:
- Next.js 14 with App Router
- React 18 + TypeScript
- Tailwind CSS for styling
- lucide-react for icons

CRITICAL RULES:
1. Generate REAL, WORKING code
2. Use TypeScript for all files
3. Use Tailwind CSS for styling
4. All features must be fully implemented

OUTPUT FORMAT - Respond with ONLY a JSON object with files array.`;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "OpenForge",
      },
      body: JSON.stringify({
        model: "openrouter/google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Build this frontend app: ${prompt}` },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No content in AI response");
  }

  let jsonStr = content;
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return parsed as GeneratedApp;
  } catch {
    return createFallbackFrontendApp(prompt);
  }
}

function createFallbackFullStackApp(prompt: string): GeneratedApp {
  const name = prompt.split(" ").slice(0, 3).join("-").toLowerCase().replace(/[^a-z0-9-]/g, "-");

  return {
    name: name || "fullstack-app",
    description: prompt,
    files: [
      {
        path: "package.json",
        content: JSON.stringify({
          name: name || "fullstack-app",
          version: "0.1.0",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint"
          },
          dependencies: {
            "next": "14.2.5",
            "react": "^18",
            "react-dom": "^18",
            "lucide-react": "^0.400.0"
          },
          devDependencies: {
            "typescript": "^5",
            "@types/node": "^20",
            "@types/react": "^18",
            "@types/react-dom": "^18",
            "tailwindcss": "^3.4.1",
            "postcss": "^8",
            "autoprefixer": "^10",
            "eslint": "^8",
            "eslint-config-next": "14.2.5"
          }
        }, null, 2)
      },
      {
        path: "src/app/page.tsx",
        content: `export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">Welcome to ${name || 'Your App'}</h1>
      <p className="mt-4 text-gray-600">${prompt}</p>
    </main>
  );
}`
      },
      {
        path: "src/app/layout.tsx",
        content: `export const metadata = {
  title: '${name || 'My App'}',
  description: 'Generated by OpenForge',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`
      }
    ],
    installCommand: "npm install",
    runCommand: "npm run dev",
  };
}

function createFallbackFrontendApp(prompt: string): GeneratedApp {
  const name = prompt.split(" ").slice(0, 3).join("-").toLowerCase().replace(/[^a-z0-9-]/g, "-");

  return {
    name: name || "frontend-app",
    description: prompt,
    files: [
      {
        path: "package.json",
        content: JSON.stringify({
          name: name || "frontend-app",
          version: "0.1.0",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint"
          },
          dependencies: {
            next: "14.2.5",
            react: "^18",
            "react-dom": "^18",
            "lucide-react": "^0.400.0"
          },
          devDependencies: {
            typescript: "^5",
            "@types/node": "^20",
            "@types/react": "^18",
            "@types/react-dom": "^18",
            tailwindcss: "^3.4.1",
            postcss: "^8",
            autoprefixer: "^10",
            eslint: "^8",
            "eslint-config-next": "14.2.5"
          }
        }, null, 2)
      },
      {
        path: "src/app/page.tsx",
        content: `export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">${name || 'Frontend App'}</h1>
      <p className="mt-4">${prompt}</p>
    </main>
  );
}`
      }
    ],
    installCommand: "npm install",
    runCommand: "npm run dev",
  };
}
