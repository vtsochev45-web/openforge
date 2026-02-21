# OpenForge Scripts

## Quick Start

### Run a Generated App

```bash
# Interactive mode - shows list of projects
npm run run:generated

# Or specify project directly
npm run run:generated -- my-app-xyz
```

This script will:
1. ✅ Check for available projects
2. ✅ Install dependencies (if needed)
3. ✅ Set up database (for full-stack apps)
4. ✅ Generate Prisma client
5. ✅ Create `.env` file (if missing)
6. ✅ Start dev server on available port

## Manual Steps (if needed)

```bash
# Go to generated project
cd generated/[project-id]

# Install
npm install

# Database setup (full-stack only)
npx prisma generate
npx prisma db push

# Run
npm run dev
```
