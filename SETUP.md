# Poke-Pet Setup Guide

## Quick Start (5 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Get your API keys

**fal.ai** (required for AI generation):
- Go to https://fal.ai/dashboard/keys
- Create a new API key
- Copy it

**Supabase** (for storing evolutions + gallery):
- Go to https://supabase.com → New project
- Run `supabase-setup.sql` in the SQL editor
- Copy your Project URL and Anon key from Settings → API

### 3. Configure env
```bash
cp .env.local.example .env.local
# Edit .env.local with your keys
```

### 4. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

---

## Deploy to Netlify

1. Push to GitHub
2. New site → Import from GitHub
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variables (from `.env.local`) in Netlify → Site Settings → Environment Variables:
   - `FAL_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Install the Netlify Next.js plugin (it auto-handles API routes)

---

## How it works

1. User uploads a pet photo
2. Picks element: **Water / Fire / Wind**
3. App rolls a random evolution tier (40% Starter → 35% Evolved → 18% Champion → 7% Legendary)
4. **fal.ai FLUX** generates the JokeMon character using the pet photo + element + tier as a prompt
5. Optional: **fal.ai Kling** animates the result into a short video
6. Results saved to Supabase for the gallery

## AI Models Used
- Image generation: `fal-ai/flux/dev/image-to-image`
- Video generation: `fal-ai/kling-video/v1.6/standard/image-to-video`
