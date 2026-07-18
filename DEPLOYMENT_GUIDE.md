# Trello SaaS - Deployment Guide

## 🚀 Deploy to Render.com (FREE)

Your project is already configured with `render.yaml` for one-click deployment on Render.com's free tier.

### Prerequisites
- GitHub account (you already have: zakiraziz/Trello-Clone)
- Render.com account (free signup with GitHub)

### Step-by-Step Deployment

#### 1. Sign Up for Render
1. Go to https://render.com
2. Click **"Get Started"** or **"Sign Up"**
3. Choose **"Sign up with GitHub"**
4. Authorize Render to access your repositories

#### 2. Deploy Using Blueprint
1. In Render Dashboard, click **"New"** → **"Blueprint"**
2. Select your repository: **zakiraziz/Trello-Clone**
3. Render will automatically detect the `render.yaml` file
4. Review the services to be deployed:
   - **trello-db** (PostgreSQL - Free tier)
   - **trello-backend** (Node.js Web Service - Free tier)
   - **trello-frontend** (Static Site - Free tier)
5. Click **"Apply"** or **"Deploy"**

#### 3. Wait for Deployment
Render will now:
- Create PostgreSQL database (~2 minutes)
- Build and deploy backend (~3-5 minutes)
- Build and deploy frontend (~2-3 minutes)

You'll see real-time logs for each service.

#### 4. Access Your Application
Once deployed, you'll get URLs like:
- **Frontend**: `https://trello-frontend.onrender.com`
- **Backend API**: `https://trello-backend.onrender.com`
- **Health Check**: `https://trello-backend.onrender.com/api/health`

### What's Included in Free Tier

✅ **PostgreSQL Database**
- 90 days free (then $7/month)
- 256 MB storage
- Automatic backups

✅ **Backend Service**
- 512 MB RAM
- 0.1 CPU
- Spins down after 15 min inactivity
- ~30 sec cold start

✅ **Frontend Static Site**
- 100 GB bandwidth
- Free SSL certificate
- CDN included
- Custom domain support

### Important Notes

#### Cold Starts
Free tier services spin down after 15 minutes of inactivity. The first request after inactivity takes ~30 seconds to wake up. This is normal for free tiers.

#### Environment Variables
All environment variables are automatically configured in `render.yaml`:
- `DATABASE_URL` - Auto-connected to PostgreSQL
- `JWT_SECRET` - Auto-generated secure key
- `CLIENT_URL` - Auto-set to frontend URL
- `CORS_ORIGIN` - Auto-configured

#### Database Migrations
If you need to run database migrations:
1. Go to backend service in Render
2. Click **"Shell"** tab
3. Run: `npm run migrate`

### Alternative Free Deployment Options

If Render doesn't work for you, here are other free options:

#### Option 1: Vercel (Frontend) + Railway (Backend)
```bash
# Frontend on Vercel
npm install -g vercel
cd Frontend
vercel

# Backend on Railway
# Go to railway.app, connect GitHub, deploy Backend folder
```

#### Option 2: Netlify (Frontend) + Supabase (Backend + DB)
```bash
# Frontend on Netlify
# Drag & drop Frontend/dist folder to netlify.com/drop

# Backend + DB on Supabase
# Go to supabase.com, create project, deploy backend
```

#### Option 3: Fly.io (Full Stack)
```bash
# Install Fly CLI
# fly launch
# Follow prompts to deploy
```

### Troubleshooting

#### Backend won't start
- Check logs in Render dashboard
- Ensure `node src/server.js` is the correct start command
- Verify all dependencies in package.json

#### Frontend can't connect to backend
- Check `VITE_API_URL` environment variable
- Verify CORS settings in backend
- Check browser console for errors

#### Database connection fails
- Verify `DATABASE_URL` is set correctly
- Check database is running in Render
- Run migrations if needed

### Custom Domain (Optional)
1. Purchase domain from any provider
2. In Render, go to service → **"Settings"** → **"Custom Domains"**
3. Add your domain
4. Update DNS records as instructed

### Monitoring
- Render provides built-in logs and metrics
- Set up alerts for downtime
- Monitor database usage in dashboard

## Need Help?

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Your GitHub Repo: https://github.com/zakiraziz/Trello-Clone

---

**Your app is ready to deploy! Just follow the steps above.** 🎉