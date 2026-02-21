#!/bin/bash
# push-to-github.sh
# Run this script after creating an empty repo on GitHub

if [ -z "$1" ]; then
    echo "Usage: ./push-to-github.sh https://github.com/YOUR_USERNAME/openforge.git"
    exit 1
fi

REPO_URL=$1

echo "Setting up remote..."
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

echo "Renaming branch to main..."
git branch -m main

echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done! Your code is now on GitHub."
echo "Next: Go to https://vercel.com/new and import your repo"
