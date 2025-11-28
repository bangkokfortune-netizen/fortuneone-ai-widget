# FortuneOne AI Widget - Railway Deployment Guide

## Quick Deploy to Railway

### Step 1: Connect GitHub Repository

1. Go to [Railway.app](https://railway.app) and login
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose repository: `bangkokfortune-netizen/fortuneone-ai-widget`

### Step 2: Configure Service

1. After connecting, Railway will detect the project
2. Click on the service and go to **"Settings"**
3. Set **Root Directory** to: `backend`
4. Railway will auto-detect the Dockerfile at `backend/Dockerfile`

### Step 3: Set Environment Variables

Go to **"Variables"** tab and add:

| Variable | Value | Description |
|----------|-------|-------------|
| `OPENAI_API_KEY` | `sk-...` | Your OpenAI API key |
| `SQUARE_ACCESS_TOKEN` | `EAA...` | Your Square API token |
| `SQUARE_LOCATION_ID` | `L...` | Your Square location ID |
| `PORT` | `4000` | Server port |

### Step 4: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (~2-3 minutes)
3. Copy your Railway URL (e.g., `https://your-app.up.railway.app`)

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check (returns `{"status":"ok"}`) |
| `GET /ws` | WebSocket endpoint for chat widget |

## WordPress Integration

Add this to your WordPress site (via Elementor HTML widget or theme footer):

```html
<!-- FortuneOne Chat Widget -->
<link 
  rel="stylesheet" 
  href="https://YOUR-CDN/fortuneone-chat-widget.css"
/>
<script 
  src="https://YOUR-CDN/fortuneone-chat-widget.js"
  data-backend-url="https://YOUR-RAILWAY-URL"
  data-business-id="bangkok-fortune"
  data-default-language="en"
></script>
```

**Replace:**
- `YOUR-CDN` = Host frontend files on SiteGround, Cloudflare Pages, or any CDN
- `YOUR-RAILWAY-URL` = Your Railway deployment URL (e.g., `https://fortuneone-ai-widget.up.railway.app`)

## File Structure

```
fortuneone-ai-widget/
+-- backend/
|   +-- Dockerfile          # Railway build config
|   +-- package.json        # Dependencies
|   +-- tsconfig.json       # TypeScript config
|   +-- src/
|       +-- server.ts       # Main server entry
|       +-- core/           # Config & types
|       +-- modules/        # Business logic
+-- frontend/
|   +-- demo.html           # Local testing
|   +-- fortuneone-chat-widget.css
|   +-- fortuneone-chat-widget.js
+-- .gitignore
+-- README_DEPLOY_RAILWAY.md
```

## Local Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend - open frontend/demo.html in browser
```

## Support

For questions, contact Bangkok Fortune Thai Massage team.
