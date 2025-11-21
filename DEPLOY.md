# 🚀 Deployment Guide

This guide covers deploying TinyLink to production environments.

## Architecture Overview

- **Backend**: Node.js/Express API (Render, Railway, or Heroku)
- **Database**: PostgreSQL (Neon, Supabase, or Railway)
- **Frontend**: React SPA (Vercel, Netlify, or Cloudflare Pages)

---

## Option 1: Render + Neon + Vercel (Recommended)

### Step 1: Database Setup (Neon)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (it looks like):
```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```
4. **Important**: Neon requires SSL, so your connection string must include `?sslmode=require`

### Step 2: Backend Deployment (Render)

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `tinylink-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build && npm run migrate:node`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
```
   DATABASE_URL=<your-neon-connection-string>
   BASE_URL=https://tinylink-api.onrender.com
   NODE_ENV=production
   JWT_SECRET=<generate-random-string>
   PORT=3000
```

6. Deploy! 🚀

### Step 3: Frontend Deployment (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:
```
   VITE_API_URL=https://tinylink-api.onrender.com
   VITE_BASE_URL=https://tinylink-api.onrender.com
```

6. Deploy! 🎉

### Step 4: Custom Domain (Optional)

**For Backend (Render)**:
1. Go to Settings → Custom Domains
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS with CNAME record

**For Frontend (Vercel)**:
1. Go to Settings → Domains
2. Add your domain (e.g., `yourdomain.com`)
3. Update DNS as instructed

### Step 5: Update Environment Variables

After setting up custom domains, update:
- Backend `BASE_URL` to your custom backend domain
- Frontend `VITE_API_URL` and `VITE_BASE_URL` to your custom backend domain

---

## Option 2: All-in-One Railway

Railway provides database, backend, and static hosting in one place.

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL database
4. Deploy backend:
   - Add service from GitHub repo
   - Set root directory: `backend`
   - Railway auto-detects Node.js
5. Add environment variables (Railway auto-injects `DATABASE_URL`)
6. Deploy frontend as static site

---

## Database Migration

### First Deployment

Migrations run automatically during the build step:
```bash
npm run migrate:node
```

### Manual Migration

If you need to run migrations manually:
```bash
# Using psql (if available)
psql $DATABASE_URL -f migrations/init.sql

# Using Node script
npm run migrate:node
```

---

## SSL Configuration

### Why `rejectUnauthorized: false`?

Managed PostgreSQL providers (Neon, Supabase, Railway) use self-signed SSL certificates. Our connection pool includes:
```typescript
ssl: process.env.NODE_ENV === 'production' 
  ? { rejectUnauthorized: false }
  : false
```

This is **safe** for managed databases because:
1. Connection is still encrypted
2. We're connecting to trusted providers
3. Alternative is no SSL, which is worse

For production with self-managed databases, use proper SSL certificates.

---

## Environment Variables Checklist

### Backend
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `BASE_URL` - Public backend URL
- ✅ `NODE_ENV=production`
- ✅ `JWT_SECRET` - Random secure string
- ✅ `PORT` - Usually 3000 (auto-set by platforms)

### Frontend
- ✅ `VITE_API_URL` - Backend API URL
- ✅ `VITE_BASE_URL` - Backend base URL (for short links)

---

## Health Checks

After deployment, verify:

1. **Backend Health**:
```bash
   curl https://your-backend-url.com/healthz
   # Should return: {"ok":true,"version":"1.0"}
```

2. **Database Connection**:
   - Check backend logs for "Database connection established"

3. **Create Link**:
```bash
   curl -X POST https://your-backend-url.com/api/links \
     -H "Content-Type: application/json" \
     -d '{"target_url":"https://example.com"}'
```

4. **Frontend**: Visit your frontend URL and create a link via UI

---

## Monitoring

### Render
- View logs: Dashboard → Logs
- Metrics: Dashboard → Metrics

### Vercel
- Analytics: Project → Analytics
- Logs: Project → Deployments → View Function Logs

### Neon
- Connection stats: Dashboard → Monitoring
- Query performance: Dashboard → Queries

---

## Troubleshooting

### "Failed to connect to database"
- Check `DATABASE_URL` is correct
- Verify SSL mode is set (`?sslmode=require` for Neon)
- Check database is running (Neon dashboard)

### "502 Bad Gateway"
- Backend might be starting (Render free tier spins down)
- Check backend logs for errors
- Verify build command succeeded

### "CORS errors"
- Check `CORS` origin in backend matches frontend URL
- Verify `BASE_URL` environment variable

### Frontend can't reach API
- Check `VITE_API_URL` is correct
- Verify backend is deployed and healthy
- Check browser console for exact error

---

## Cost Estimates

### Free Tier (Good for testing):
- Neon: Free tier (1 project, 3GB storage)
- Render: Free tier (spins down after inactivity)
- Vercel: Free tier (unlimited bandwidth for personal)
- **Total: $0/month**

### Production Tier:
- Neon: $19/month (Pro plan)
- Render: $7/month (always-on)
- Vercel: Free (or $20/month for team)
- **Total: ~$26-46/month**

---

## Backup Strategy

### Database Backups

**Neon**: 
- Automatic daily backups (7-day retention on Pro)
- Manual backups: Use `pg_dump`
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore from Backup
```bash
psql $DATABASE_URL < backup.sql
```

---

## Scaling Considerations

### Database
- Monitor connection pool usage
- Increase pool size if needed (`max: 20` → `max: 50`)
- Consider read replicas for high traffic

### Backend
- Scale horizontally (multiple Render instances)
- Add Redis for caching popular links
- Implement CDN for static redirects

### Frontend
- Vercel handles scaling automatically
- Add CDN for assets

---

## Security Checklist

- ✅ HTTPS enabled (automatic on Render/Vercel)
- ✅ Rate limiting configured
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (parameterized queries)
- ✅ Helmet security headers
- ✅ CORS properly configured
- ✅ Environment variables secured (never in code)
- ✅ Database credentials rotated regularly

---

## Next Steps

1. Set up monitoring (Sentry, LogRocket)
2. Configure custom domain
3. Add analytics (PostHog, Plausible)
4. Implement automated backups
5. Set up CI/CD pipeline
6. Add integration tests

For questions, refer to RUNBOOK.md for API testing commands.