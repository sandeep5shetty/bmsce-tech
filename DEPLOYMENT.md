# Vercel Deployment Guide

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A PostgreSQL database (use Neon, Supabase, Vercel Postgres, or any cloud provider)

## Deployment Steps

### 1. Prepare Your Database

Get a PostgreSQL connection string from your provider. It should look like:

```
postgresql://username:password@host:port/database?sslmode=require
```

### 2. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 3. Deploy on Vercel

#### Option A: Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:

   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (already configured in package.json)
   - **Output Directory**: `.next`

4. Add Environment Variables:

   - Click "Environment Variables"
   - Add: `DATABASE_URL` = `your_postgresql_connection_string`

5. Click "Deploy"

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variable
vercel env add DATABASE_URL

# Redeploy with environment variable
vercel --prod
```

### 4. Run Database Migrations

After deployment, you need to run migrations:

#### Option 1: Using Vercel CLI

```bash
# Set environment variable locally for migration
export DATABASE_URL="your_connection_string"

# Run migration
npx prisma migrate deploy
```

#### Option 2: Using your database provider's console

Run the SQL from your migration files directly in your database console.

### 5. Seed the Database (Optional)

```bash
# Set DATABASE_URL
export DATABASE_URL="your_connection_string"

# Run seed
npx tsx prisma/seed.ts
```

## Important Notes

### Environment Variables

Make sure to set these in Vercel:

- `DATABASE_URL` - Your PostgreSQL connection string

### Build Configuration

The `package.json` already includes:

- `postinstall`: Generates Prisma Client after install
- `build`: Generates Prisma Client before building Next.js

### Database Connection Pooling

For serverless deployments like Vercel, use connection pooling:

1. **Neon**: Use the pooled connection string (ends with `?sslmode=require`)
2. **Supabase**: Use the "Session" mode connection string
3. **Vercel Postgres**: Already optimized for serverless

### Common Issues

#### "Module '@prisma/client' has no exported member 'PrismaClient'"

- Solution: Prisma Client wasn't generated. The `postinstall` script should handle this.

#### "Can't reach database server"

- Check your `DATABASE_URL` is correct
- Ensure your database allows connections from Vercel IPs
- For some providers, you may need to whitelist `0.0.0.0/0`

#### "Too many connections"

- Use connection pooling
- Consider using Prisma Accelerate for connection pooling

## Updating Your Deployment

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will automatically redeploy on push.

## Monitoring

1. Go to your Vercel dashboard
2. Click on your project
3. Check:
   - Deployments
   - Logs (for debugging)
   - Analytics

## Rollback

If something goes wrong:

1. Go to Vercel dashboard
2. Select your project
3. Go to "Deployments"
4. Find a previous working deployment
5. Click "..." → "Promote to Production"

## Local Development After Deployment

```bash
# Pull environment variables
vercel env pull

# This creates .env.local with your production variables
# Don't commit this file!
```

## Custom Domain (Optional)

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed
