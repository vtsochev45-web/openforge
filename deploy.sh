#!/bin/bash

# OpenForge Deployment Script
# Run this on your local machine after installing Vercel CLI

echo "🚀 Deploying OpenForge to Vercel..."

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if OPENROUTER_API_KEY is set
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo ""
    echo "⚠️  Please set your OPENROUTER_API_KEY environment variable"
    echo "Get your key at: https://openrouter.ai/keys"
    echo ""
    echo "Then run: export OPENROUTER_API_KEY=your-key-here"
    exit 1
fi

# Deploy to Vercel
echo ""
echo "🔑 Logging into Vercel..."
vercel login

echo ""
echo "📦 Deploying..."
vercel --prod --env OPENROUTER_API_KEY="$OPENROUTER_API_KEY"

echo ""
echo "✅ Deployment complete!"
echo "Your app should be live at the URL shown above."
