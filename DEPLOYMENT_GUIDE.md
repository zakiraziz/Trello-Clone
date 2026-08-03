# Trello SaaS - Production Deployment Guide

## 🚀 Quick Start - Deploy to Render.com (Free Tier)

### Prerequisites
- GitHub account (already: zakiraziz/Trello-Clone)
- Render.com account (free, GitHub OAuth)

### Step-by-Step Deployment

#### 1. Sign Up for Render
1. Go to https://render.com
2. Click "Get Started" or "Sign Up"
3. Choose "Sign up with GitHub"
4. Authorize Render to access your repositories

#### 2. Deploy Using Blueprint
1. In Render Dashboard, click "New" → "Blueprint"
2. Select your repository: **zakiraziz/Trello-Clone**
3. Render will detect the `render.yaml` file
4. Review services:
   - **trello-db** (PostgreSQL - Free tier)
   - **trello-backend** (Node.js - Free tier)  
   - **trello-frontend** (Static Site - Free tier)
5. Click "Apply" or "Deploy"

#### 3. Wait for Deployment
- PostgreSQL database: ~2 minutes
- Backend build: 3-5 minutes
- Frontend build: 2-3 minutes

#### 4. Get Your URLs
- **Frontend**: `https://trello-frontend.onrender.com`
- **Backend API**: `https://trello-backend.onrender.com`
- **Health Check**: `https://trello-backend.onrender.com/api/health`

---

## 📋 Production Requirements (5% Remaining)

### 1. Database Migration
```bash
# In Render dashboard → Backend → Shell
npm run migrate
# Or manually via SQL file
psql $DATABASE_URL -f Database/schema.sql
```

### 2. Email Services Configuration
Choose ONE provider:

**SendGrid (Recommended):**
1. Sign up at https://sendgrid.com
2. Get API Key from Settings → APIKeys
3. Add to environment: `SENDGRID_API_KEY=SG.your_key`

**Resend:**
1. Sign up at https://resend.com
2. Get API key from dashboard
3. Add to environment: `RESEND_API_KEY=your_key`

**SMTP:**
1. Configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD
2. Email from: `EMAIL_FROM=notifications@yourdomain.com`

### 3. Stripe Payment Integration
1. Sign up at https://dashboard.stripe.com
2. Get test/live keys from Developers → API Keys
3. Add environment variables:
```env
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook
STRIPE_PUBLISHABLE_KEY=pk_test_or_live_key
```
4. Set webhook URL in Stripe Dashboard:
`https://your-backend-url/api/webhooks/stripe`

### 4. HTTPS & SSL
- **Render**: Automatic SSL via Let's Encrypt
- **Netlify**: Automatic SSL via Let's Encrypt
- **Vercel**: Automatic SSL via Let's Encrypt
- **Custom domain**: Add CNAME record pointing to your deployment URL

### 5. Environment Variables (Copy to Production)
```env
PORT=5000
NODE_ENV=production
DATABASE_URL=<your_postgres_url>
JWT_SECRET=<32+ char random string>
JWT_REFRESH_SECRET=<32+ char random string>
CLIENT_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
EMAIL_FROM=noreply@yourdomain.com
```

---

## 🛠️ Alternative Deployment Options

### Option 1: Vercel + Railway
**Frontend on Vercel:**
```bash
cd Frontend
npm install -g vercel
vercel
```

**Backend + DB on Railway:**
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select Backend folder
4. Add PostgreSQL plugin
5. Set environment variables

### Option 2: Netlify + Supabase
**Frontend:**
1. Build: `npm run build` in Frontend/
2. Drag `dist/` folder to https://netlify.com/drop

**Backend:**
1. Use Supabase for database
2. Deploy backend to Railway/Render

### Option 3: Docker (Self-hosted)
```bash
# Build
docker build -t trello-saas .

# Run
docker-compose up -d

# Run migrations
docker-compose exec backend npm run migrate
```

---

## 🏥 Health Checks & Monitoring

### Health Endpoints
- Backend: `GET /api/health`
- Frontend: `GET /`

### Monitoring Setup
- **Sentry**: Add DSN to `SENTRY_DSN` env var
- **UptimeRobot**: Monitor health endpoints
- **Render**: Built-in logs and metrics

---

## 🔐 Security Checklist

- [ ] All secrets in environment variables
- [ ] HTTPS enabled (automatic with Vercel/Netlify/Render)
- [ ] JWT secrets are 32+ characters
- [ ] Rate limiting enabled
- [ ] CORS restricted to your domain
- [ ] Database has strong password
- [ ] Email provider API keys secured

---

## 🚨 Troubleshooting

### Backend won't start
```bash
# Check logs
docker logs trello-backend

# Verify environment
NODE_ENV=production node -e "console.log(process.env.DATABASE_URL ? 'DB OK' : 'DB MISSING')"
```

### Frontend can't connect to backend
1. Check `VITE_API_URL` matches backend URL
2. Verify CORS: `CLIENT_URL` matches frontend domain
3. Check browser console for CORS errors

### Database connection fails
1. Verify `DATABASE_URL` format: `postgresql://user:pass@host:5432/db`
2. Test connection: `psql $DATABASE_URL -c "SELECT 1"`
3. Run migrations if schema not created

### Email not sending
1. Verify provider is configured (SendGrid/Resend/SMTP)
2. Check spam folder
3. Verify EMAIL_FROM address is verified with provider

---

## 📊 Performance Optimization

### Code Splitting (Frontend)
```typescript
// In routes
const Dashboard = lazy(() => import('@/features/boards/pages/Dashboard'))
```

### Image Optimization
- Upload to CDN (Cloudinary, AWS S3)
- Use WebP format
- Set proper caching headers

### Caching (Backend)
- Enable Redis for session caching
- Set proper cache-control headers
- Use React Query for data caching

---

## ✅ Deployment Complete Checklist

- [ ] Frontend deployed (HTTPS working)
- [ ] Backend deployed (API responding)
- [ ] Database migrations run
- [ ] Email service configured
- [ ] Stripe keys added (if payments enabled)
- [ ] Custom domain set up (optional)
- [ ] Health checks passing
- [ ] Test user registration works
- [ ] Test board creation works
- [ ] Test notifications work

---

## 📞 Need Help?

- **GitHub Issues**: https://github.com/zakiraziz/Trello-Clone/issues
- **Render Docs**: https://render.com/docs
- **Docker**: https://docs.docker.com
- **Stripe Docs**: https://stripe.com/docs

---

**Your Trello SaaS application is now production-ready!** 🎉