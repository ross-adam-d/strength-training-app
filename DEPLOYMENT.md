# Deployment Guide

This guide covers deploying the Strength Training App to Vercel with PostgreSQL.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- GitHub CLI (optional, for easier repo creation)

## Step-by-Step Deployment

### 1. Prepare Environment Variables

Before deploying, generate a secure secret for production:

```bash
openssl rand -base64 32
```

Save this value - you'll need it for `NEXTAUTH_SECRET`.

### 2. Create GitHub Repository

From the project directory:

```bash
cd strength-training-app

# Initialize git if not already done
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Strength training app with periodization"

# Create GitHub repository (using gh CLI)
gh repo create strength-training-app --public --source=. --remote=origin

# Push to GitHub
git push -u origin main
```

**Alternative (without gh CLI):**
1. Create a new repository on GitHub.com
2. Follow GitHub's instructions to push your local repo

### 3. Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your `strength-training-app` repository from GitHub
4. Vercel will auto-detect it's a Next.js project
5. **Do not deploy yet** - we need to configure first

### 4. Set Up Vercel Postgres

1. In your Vercel project, go to **Storage** tab
2. Click **"Create Database"** → **"Postgres"**
3. Choose a region close to your users
4. Click **"Create"**
5. Vercel will automatically add these environment variables:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL` (use this for `DATABASE_URL`)
   - `POSTGRES_URL_NON_POOLING`
   - etc.

### 5. Configure Environment Variables

In your Vercel project settings → **Environment Variables**, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | Use `POSTGRES_PRISMA_URL` from Vercel Postgres | Production, Preview, Development |
| `NEXTAUTH_URL` | Your production URL (e.g., `https://your-app.vercel.app`) | Production |
| `NEXTAUTH_URL` | `https://your-preview.vercel.app` | Preview |
| `NEXTAUTH_SECRET` | Generated secret from step 1 | Production, Preview, Development |

**Important**: For `DATABASE_URL`, click on the Vercel Postgres database and use the **Prisma** connection string (`POSTGRES_PRISMA_URL`), not the regular one.

### 6. Deploy

Click **"Deploy"** in Vercel. The first deployment will fail - this is expected because the database tables don't exist yet.

### 7. Run Database Migrations

You have two options:

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed the database
npx tsx prisma/seed.ts
```

#### Option B: Using Prisma Data Platform

1. Go to [cloud.prisma.io](https://cloud.prisma.io)
2. Import your project
3. Connect to Vercel Postgres
4. Run migrations from the UI

#### Option C: Manual SQL Execution

1. In Vercel, go to your Postgres database → **Data** tab
2. Click **Query**
3. Copy the SQL from your migration files
4. Execute manually
5. Then run the seed script locally with production DATABASE_URL

### 8. Redeploy

After migrations are complete:

```bash
# Trigger a new deployment
vercel --prod
```

Or push a new commit to GitHub:

```bash
git commit --allow-empty -m "Trigger redeployment"
git push
```

### 9. Verify Deployment

1. Visit your production URL
2. Register a new account
3. Create a macrocycle
4. Create a mesocycle
5. Create a microcycle
6. Create a workout
7. Log a workout
8. View progress

If everything works, you're done!

## Post-Deployment

### Set Up Custom Domain (Optional)

1. In Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. Update `NEXTAUTH_URL` to match your domain

### Enable Automatic Deployments

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you open a Pull Request

### Monitor Performance

1. Check **Analytics** tab in Vercel for:
   - Page load times
   - Error rates
   - Traffic patterns

2. Check **Logs** tab for:
   - Server errors
   - API request logs
   - Build logs

## Database Backups

### Automatic Backups (Vercel Pro)

Vercel Pro includes automatic daily backups.

### Manual Backups

```bash
# Pull environment variables
vercel env pull .env.local

# Use pg_dump (requires PostgreSQL client installed)
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

## Updating the App

When you make changes:

```bash
# Make changes to code
# ...

# Commit changes
git add .
git commit -m "Description of changes"
git push

# Vercel will automatically deploy
```

### Database Schema Changes

When you modify `prisma/schema.prisma`:

```bash
# Create a new migration
npx prisma migrate dev --name description_of_change

# Commit the migration
git add prisma/migrations
git commit -m "Add migration: description"
git push

# After deploy, run migration on production
vercel env pull .env.local
npx prisma migrate deploy
```

## Troubleshooting

### Deployment Fails with Database Error

**Issue**: "Can't reach database server"

**Solution**:
1. Check that `DATABASE_URL` is set correctly
2. Verify you're using `POSTGRES_PRISMA_URL` not `POSTGRES_URL`
3. Make sure Vercel Postgres is in the same region as your app

### NextAuth Session Issues

**Issue**: Can't login after deployment

**Solution**:
1. Verify `NEXTAUTH_URL` matches your domain exactly (include https://)
2. Check `NEXTAUTH_SECRET` is set in production
3. Clear browser cookies and try again

### Prisma Client Issues

**Issue**: "@prisma/client could not be found"

**Solution**:
1. Make sure `postinstall` script in package.json includes `prisma generate`
2. Check build logs to verify Prisma Client was generated
3. If needed, add to `package.json`:
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```

### Migration Fails

**Issue**: Migration failed with conflict

**Solution**:
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually fix conflicts in the database
```

## Scaling Considerations

### Database Performance

- **Vercel Postgres** has connection limits:
  - Hobby (free): 60 connections
  - Pro: 120+ connections
- Use connection pooling (Prisma does this automatically)
- Consider upgrading to Pro if you hit limits

### API Rate Limits

- Implement caching for frequently accessed data
- Use `revalidate` in Next.js for static generation
- Consider Redis for session storage if needed

### Asset Optimization

- Images are already optimized by Next.js
- Consider using a CDN for static assets
- Enable Vercel's Edge Network (automatic)

## Security Checklist

- [ ] `NEXTAUTH_SECRET` is unique and secure (32+ characters)
- [ ] `DATABASE_URL` contains credentials - never commit to git
- [ ] HTTPS is enabled (Vercel does this automatically)
- [ ] CORS is properly configured (Next.js handles this)
- [ ] Input validation is in place (Zod schemas)
- [ ] SQL injection prevention (Prisma parameterizes queries)
- [ ] Authentication is required for all dashboard routes

## Cost Estimation

### Vercel Hobby (Free)

- Unlimited deployments
- 100 GB bandwidth/month
- Serverless function execution: 100 hours/month
- **Good for**: Personal use, demos, small user base

### Vercel Pro ($20/month)

- Everything in Hobby
- Commercial use allowed
- Analytics
- Advanced monitoring
- **Good for**: Production apps with moderate traffic

### Database Costs

**Vercel Postgres:**
- Hobby: Free (60 connections, 256 MB storage)
- Pro: $20/month (120 connections, 512 MB storage)

**Alternatives:**
- Railway: $5/month for 1GB
- Supabase: Free tier available
- DigitalOcean: $15/month for 1GB

## Monitoring and Maintenance

### Weekly Tasks

- [ ] Check error logs in Vercel
- [ ] Monitor database size
- [ ] Review slow API endpoints

### Monthly Tasks

- [ ] Update dependencies: `npm update`
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Review and archive old logs
- [ ] Backup database manually

### Quarterly Tasks

- [ ] Review and optimize database indexes
- [ ] Analyze usage patterns
- [ ] Plan feature updates
- [ ] Update Next.js to latest stable version

## Support

For issues with:
- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Prisma**: [prisma.io/docs](https://prisma.io/docs)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)

---

**Deployed Successfully?** Enjoy tracking your strength training! 💪
