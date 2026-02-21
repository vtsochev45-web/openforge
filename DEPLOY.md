# Deployment Guide

## Quick Start

### Prerequisites
- Node.js 18+ installed
- A Vercel account (free at vercel.com)
- An OpenRouter API key (free at openrouter.ai/keys)

### Method 1: Using the Deploy Script (Easiest)

1. **Copy the project to your machine:**
   ```bash
   # Option A: If you have the zip
   unzip openforge.zip
   cd openforge
   
   # Option B: If you cloned from GitHub
   git clone <repo-url>
   cd openforge
   ```

2. **Set your OpenRouter API key:**
   ```bash
   export OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

3. **Run the deploy script:**
   ```bash
   ./deploy.sh
   ```

4. **Follow the prompts** - Vercel will ask you to login via browser

### Method 2: Manual Deploy

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd openforge
   vercel --prod
   ```

4. **Add environment variable in Vercel dashboard:**
   - Go to your project on vercel.com
   - Settings → Environment Variables
   - Add `OPENROUTER_API_KEY` with your key
   - Redeploy

### Method 3: GitHub + Vercel (Recommended for updates)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/openforge.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to vercel.com
   - Click "Add New Project"
   - Import your GitHub repo
   - Add `OPENROUTER_API_KEY` environment variable
   - Deploy

## Post-Deployment

Once deployed, you'll get a URL like `https://openforge-yourname.vercel.app`

**Important:** Add your OpenRouter API key to the Vercel environment variables or the AI generation won't work.

## Troubleshooting

**Build fails?**
- Make sure `OPENROUTER_API_KEY` is set in environment variables
- Check Node.js version (needs 18+)

**AI generation fails?**
- Verify your OpenRouter API key is valid
- Check that you have credits on OpenRouter

**Changes not showing?**
- Vercel deploys are instant, but clear browser cache if needed

## Custom Domain

1. Go to your project on vercel.com
2. Settings → Domains
3. Add your domain and follow DNS instructions

## Updating Your Deployment

**If using GitHub:**
Just push to your repo - Vercel auto-deploys

**If using CLI:**
Run `vercel --prod` again after making changes
