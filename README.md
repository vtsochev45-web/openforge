# OpenForge MVP

A Base44 alternative that generates full-stack Next.js apps with AI. You own the code completely.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fopenforge&env=OPENROUTER_API_KEY&envDescription=OpenRouter%20API%20Key%20for%20AI%20code%20generation&envLink=https%3A%2F%2Fopenrouter.ai%2Fkeys)

## What This Is

OpenForge is an AI-powered app generator that creates complete Next.js applications from natural language prompts. Unlike Base44:

- **You own the code** - Generated apps are standard Next.js projects
- **Local development** - Apps run locally, iterate without per-prompt costs
- **No vendor lock-in** - Deploy anywhere (Vercel, Railway, self-hosted)
- **Clean code** - Follows best practices, fully editable

## Quick Deploy

### Option 1: One-Click Deploy (Recommended)
Click the **Deploy with Vercel** button above and:
1. Connect your GitHub account
2. Add your OpenRouter API key (get one at [openrouter.ai/keys](https://openrouter.ai/keys))
3. Click Deploy

### Option 2: Manual Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd openforge
vercel --prod
```

### Option 3: Git Push
Push to GitHub and connect to Vercel:
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
# Then connect repo on vercel.com
```

## Tech Stack

- **Generator Interface**: Next.js 14 + TypeScript + Tailwind + shadcn/ui
- **Code Editor**: Monaco Editor (VS Code in browser)
- **AI**: OpenRouter API (Gemini 2.5 Flash by default)
- **Generated Apps**: Next.js 14 + TypeScript + Tailwind + Prisma-ready

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | Get from [openrouter.ai/keys](https://openrouter.ai/keys) |

## Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local and add your OPENROUTER_API_KEY

# Run dev server
npm run dev

# Open http://localhost:3000
```

## How to Use

1. **Describe your app** in the prompt box (e.g., "Build a task manager with user auth")
2. **Click Generate** - AI creates a complete Next.js app
3. **View the code** - Browse files, see the generated code in Monaco Editor
4. **Download or run locally** - Each project is a runnable Next.js app

## Project Structure

```
openforge/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai-chat/route.ts       # AI chat for code collaboration
│   │   │   ├── ai-collab/chat/route.ts # AI collaboration endpoints
│   │   │   ├── auth/[...nextauth]/    # NextAuth.js authentication
│   │   │   ├── generate/route.ts      # AI code generation API with backend integration
│   │   │   └── project/[id]/          # Project management APIs
│   │   │       ├── exec/route.ts      # Run generated apps
│   │   │       ├── files/route.ts     # File CRUD operations
│   │   │       ├── restore/route.ts   # Version restore
│   │   │       └── versions/route.ts  # Version history
│   │   ├── project/[id]/page.tsx      # Project viewer/editor with Monaco
│   │   ├── page.tsx                   # Main prompt interface
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ai-collab/                 # AI Collaboration components
│   │   │   ├── AIChatSidebar.tsx      # AI chat panel
│   │   │   ├── CodeSuggestionOverlay.tsx # Inline code suggestions
│   │   │   └── VersionHistory.tsx     # Version tracking UI
│   │   └── ui/                        # shadcn/ui components
│   └── lib/
│       ├── api/                       # API generation utilities
│       │   ├── api-generator.ts       # CRUD route generator
│       │   ├── templates/             # Code templates
│       │   ├── types.ts               # TypeScript definitions
│       │   └── utils.ts               # API utilities
│       ├── auth.ts                    # NextAuth configuration
│       ├── auth/                      # Auth utilities
│       │   ├── templates.ts           # Auth component templates
│       │   └── validators.ts          # Input validation
│       ├── db/                        # Database utilities
│       │   ├── index.ts               # Database exports
│       │   └── schema-generator.ts    # Prisma schema generation
│       └── prisma.ts                  # Prisma client singleton
├── prisma/
│   └── schema.prisma                  # Base Prisma schema with auth models
├── generated/                         # Generated apps stored here
└── docs/
    └── openforge-plan.md              # Original plan
```

## Generated App Structure

Each generated app is a complete Next.js 14 project:

```
generated/{project-id}/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── ...
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## Current Status (MVP)

✅ Working:
- Prompt-based app generation
- Project listing and viewing
- Monaco Editor for code viewing
- **AI Chat Sidebar** - Iterative code improvement with AI
- **Version History** - Track and restore code changes
- **Database Integration (Prisma)** - Auto-generated schemas and CRUD API routes
- **Authentication (NextAuth.js)** - Complete auth system with login/register
- **Backend Infrastructure** - Automatic Prisma + API route generation
- Basic terminal output for install/run commands

🚧 In Progress:
- Build optimization for Vercel deployment
- CRUD template refinements
- Database migration automation

## Roadmap

### Phase 1: Core (Done)
- [x] Basic generator interface
- [x] AI code generation via OpenRouter
- [x] Project management (create, view, list)
- [x] Monaco Editor integration

### Phase 2: Code Quality ✅ DONE
- [x] Live code editing with save
- [x] Iterative improvement (chat with AI about code)
- [x] **AI Chat Sidebar** - Real-time AI collaboration
- [x] **Version History** - Track code changes
- [x] Syntax highlighting for all file types
- [x] File creation/deletion

### Phase 3: Backend Integration ✅ DONE
- [x] **Prisma schema generation** - Extract models from prompts
- [x] **Database connection setup** - SQLite/Postgres with Prisma
- [x] **Auth template generation** - NextAuth.js with bcrypt
- [x] **API route generation** - Full CRUD endpoints (list, create, read, update, delete)
- [x] **Soft delete support** - Optional soft delete patterns
- [x] **Backend-First Architecture** - Programmatic backend + AI frontend merge

### Phase 4: Deployment
- [x] Vercel deploy button
- [ ] Export to GitHub
- [ ] Railway template
- [ ] Docker image generation

## Comparison with Base44

| Feature | Base44 | OpenForge MVP |
|---------|--------|---------------|
| Code ownership | ❌ Locked platform | ✅ Full source code |
| Local dev | ❌ Cloud only | ✅ Local-first |
| Custom packages | ❌ Limited | ✅ Full npm access |
| Export code | ❌ Difficult | ✅ Standard Next.js app |
| Self-host | ❌ No | ✅ Deploy anywhere |
| Pricing | Credit-based | Your API key (transparent costs) |

## License

MIT - Use it, fork it, build on it.
