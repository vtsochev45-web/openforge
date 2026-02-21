import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { extractSchemaFromPrompt, generatePrismaSchema, generateEnvTemplate } from "@/lib/db";
import { generateAPRoutes } from "@/lib/api-generator";
import type { ModelDefinition } from "@/lib/db";

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
  schema?: string;
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

/**
 * Generate backend infrastructure files based on extracted models
 */
async function generateBackendInfrastructure(
  models: ModelDefinition[],
  appName: string
): Promise<FileStructure[]> {
  const files: FileStructure[] = [];
  const provider = process.env.DATABASE_PROVIDER || "sqlite";

  // Generate Prisma schema
  const schemaConfig = {
    provider: provider as "sqlite" | "postgresql",
    url: 'env("DATABASE_URL")',
  };
  const prismaSchema = generatePrismaSchema(models, schemaConfig);

  files.push({
    path: "prisma/schema.prisma",
    content: prismaSchema,
  });

  // Generate API routes
  const apiRoutes = generateAPRoutes(models, { authRequired: true }, { softDelete: true });

  for (const route of apiRoutes) {
    files.push({
      path: `src/app/${route.path}`,
      content: route.content,
    });
  }

  // Generate .env.example
  files.push({
    path: ".env.example",
    content: generateEnvTemplate(provider),
  });

  // Generate lib files
  files.push(
    {
      path: "src/lib/prisma.ts",
      content: `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
`,
    },
    {
      path: "src/lib/db.ts",
      content: `export { prisma } from './prisma';
`,
    }
  );

  return files;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateFullStackApp(prompt: string, projectId: string): Promise<GeneratedApp> {
  // Phase 3: Extract models from prompt and generate backend infrastructure
  const models = await extractSchemaFromPrompt(prompt);
  const backendFiles = await generateBackendInfrastructure(models, projectId);

  const systemPrompt = `You are an expert full-stack developer. Generate a complete FULL-STACK Next.js 14 application with database, auth, and API routes.

TECH STACK:
- Next.js 14 with App Router
- React 18 + TypeScript
- Tailwind CSS for styling
- Prisma ORM with SQLite database
- NextAuth.js for authentication
- bcrypt for password hashing
- Server Actions for mutations

IMPORTANT: Your schema must match these models exactly:
${models.map(m => `- ${m.name}: ${m.fields.map(f => f.name).join(', ')}`).join('\n')}

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
2. prisma/schema.prisma - complete database schema (see models above)
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
    const aiGeneratedApp = parsed as GeneratedApp;

    // Phase 3: Merge AI-generated frontend with programmatic backend
    // Prioritize backend-infrastructure files over AI-generated ones
    const aiFilePaths = new Set(aiGeneratedApp.files.map(f => f.path));

    // Filter out AI-generated backend files that we generate programmatically
    const filteredAiFiles = aiGeneratedApp.files.filter(f => {
      const isBackendFile =
        f.path === 'prisma/schema.prisma' ||
        f.path.startsWith('src/app/api/') ||
        f.path === 'src/lib/prisma.ts' ||
        f.path.startsWith('src/lib/api');
      return !isBackendFile;
    });

    // Merge: AI frontend + programmatic backend
    aiGeneratedApp.files = [
      ...filteredAiFiles,
      ...backendFiles,
    ];

    return aiGeneratedApp;
  } catch {
    console.error("Failed to parse AI response, using fallback with backend infrastructure");

    // Fallback with backend infrastructure
    const fallbackApp = createFallbackFullStackApp(prompt);
    fallbackApp.files = [
      ...fallbackApp.files.filter(f => !f.path.startsWith('src/app/api/')),
      ...backendFiles,
    ];
    return fallbackApp;
  }


// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateFrontendApp(prompt: string, projectId: string): Promise<GeneratedApp> {
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
            lint: "next lint",
            "db:generate": "prisma generate",
            "db:push": "prisma db push",
            "db:studio": "prisma studio"
          },
          dependencies: {
            "next": "14.2.5",
            "react": "^18",
            "react-dom": "^18",
            "@prisma/client": "^5.8.0",
            "next-auth": "^4.24.5",
            "bcryptjs": "^2.4.3",
            "lucide-react": "^0.400.0"
          },
          devDependencies: {
            "typescript": "^5",
            "@types/node": "^20",
            "@types/react": "^18",
            "@types/react-dom": "^18",
            "@types/bcryptjs": "^2.4.6",
            "prisma": "^5.8.0",
            "tailwindcss": "^3.4.1",
            "postcss": "^8",
            "autoprefixer": "^10",
            "eslint": "^8",
            "eslint-config-next": "14.2.5"
          }
        }, null, 2)
      },
      // Prisma schema
      {
        path: "prisma/schema.prisma",
        content: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
}
`
      },
      // ... more files
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
      // ... more files
    ],
    installCommand: "npm install",
    runCommand: "npm run dev",
  };
}
}
