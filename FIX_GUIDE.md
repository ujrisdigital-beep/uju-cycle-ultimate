# IKENGA + UJU CYCLE FIX GUIDE

## Fix 1: ikenga.vercel.app 404 Error
### Root Cause: Missing root page in Next.js app
✅ **Fixed**: Created `frontend/app/page.tsx` that redirects to `/analyze`

### Verify Vercel Settings:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select `ikenga` project (or your UJU Cycle project)
3. Settings → General:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Redeploy: `npx vercel --prod`

## Fix 2: UJU Cycle on ikenga.tech Stuck on "Engine Warming Up"
### Root Causes:
1. Backend (Ollama) not accessible from cloud
2. Missing error handling in frontend
3. Ollama models not pulled

### Steps to Fix:
#### A. Deploy Backend to Render (with Ollama)
1. Push `C:\uju-world-class\backend` to GitHub
2. Create new Render Web Service:
   - Runtime: Docker
   - Connect GitHub repo
   - Environment Variables:
     ```
     OLLAMA_HOST=http://ollama:11434
     DATABASE_URL=postgresql://uju:password@db:5432/uju_cycle
     ```
3. Render will use the `Dockerfile` we created, which includes Ollama

#### B. Pull Ollama Models on Render
After deployment, open Render shell and run:
```bash
docker exec uju-world-class-ollama-1 ollama pull phi3:3.8b
docker exec uju-world-class-ollama-1 ollama pull mixtral:8x7b
docker exec uju-world-class-ollama-1 ollama pull llama3.1:70b
```

#### C. Set Frontend Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
```
BACKEND_URL=https://uju-backend.onrender.com
NEXTAUTH_SECRET=random_32_char_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
```

#### D. Map Custom Domain (ikenga.tech)
1. Vercel Dashboard → Settings → Domains
2. Add `ikenga.tech`
3. Update your domain registrar DNS:
   ```
   Type: A, Name: @, Value: 76.76.21.21
   Type: CNAME, Name: www, Value: cname.vercel-dns.com
   ```

## Quick Test Locally
```bash
cd C:\uju-world-class
docker-compose -f infra/docker-compose.yml up -d
cd frontend && npm run dev
# Visit http://localhost:3000
```
