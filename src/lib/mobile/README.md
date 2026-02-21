# Mobile Generator for OpenForge

## Cross-Platform App Generation

This module adds **React Native mobile app generation** to OpenForge, making it superior to Base44 which only generates web apps.

## Features

- ✅ **Web + Mobile** from single prompt
- ✅ **Shared Backend** - One API serves all platforms
- ✅ **React Native + Expo** - Cross-platform iOS/Android
- ✅ **Component Mapping** - Auto-converts web components to mobile

## Usage

```bash
POST /api/generate
{
  "prompt": "Build a food delivery app",
  "projectId": "abc123",
  "platform": "all"  // web, mobile, or all
}
```

## Output Structure

```
generated/{projectId}/
├── web/          # Next.js web app (localhost:3000)
├── mobile/       # React Native app (Expo)
├── backend/      # Shared API (localhost:3001)
└── project.json  # Metadata
```

## Running the Apps

```bash
# Web
cd web && npm run dev

# Mobile
cd mobile && npx expo start
# Scan QR code with Expo Go app

# Backend
cd backend && npm run dev
```
