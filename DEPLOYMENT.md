# Render Deployment Guide

Complete step-by-step instructions for deploying the OBD2 Diagnostic Web Application to Render.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Environment Variables](#environment-variables)
- [Build and Runtime Configuration](#build-and-runtime-configuration)
- [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
- [Custom Domain Setup](#custom-domain-setup)
- [Logs and Debugging](#logs-and-debugging)
- [Database Setup (Future)](#database-setup-future)

## Prerequisites

1. **GitHub Repository**
   - Push your code to a public or private GitHub repository
   - Ensure `.gitignore` excludes `node_modules`, `.env`, etc.

2. **Render Account**
   - Sign up at https://render.com
   - Link your GitHub account for deployments

3. **Environment**
   - Valid Node.js 18.x project
   - All dependencies in `package.json` files
   - Proper build and start scripts configured

## Quick Start

### Option 1: Render Dashboard (Recommended)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Name your service (e.g., `obd2-diagnostic-app`)
5. Configure settings:
   - **Runtime**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
6. Add environment variables (see [Environment Variables](#environment-variables))
7. Click **"Create Web Service"**

### Option 2: render.yaml Configuration

The project includes `render.yaml` with full infrastructure as code configuration.

1. Push your code with `render.yaml` to GitHub
2. Go to https://dashboard.render.com
3. Click **"New +"** → **"Web Service"**
4. Choose **"Connect from a repository"**
5. Select your repository
6. Select branch: `feat/init-obd2-web-render-deploy` (or your deployment branch)
7. Render automatically detects `render.yaml` and uses those settings
8. Click **"Create Web Service"**

## Detailed Setup

### Step 1: Prepare Repository

Ensure your repository root contains:

```
- package.json (root level)
- client/package.json
- server/package.json
- render.yaml
- .renderignore
- .gitignore
```

Verify all files are committed:

```bash
git add .
git commit -m "Add web OBD app with Render deployment config"
git push origin feat/init-obd2-web-render-deploy
```

### Step 2: Create Render Service

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Select **"Build and deploy from a Git repository"**
4. Connect your GitHub account if needed
5. Search for and select your repository
6. Click **"Connect"**

### Step 3: Configure Service

Fill in the service configuration:

| Setting | Value |
|---------|-------|
| **Name** | `obd2-diagnostic-app` |
| **Runtime** | `Node` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (or Paid) |

### Step 4: Add Environment Variables

Click **"Advanced"** to add environment variables:

| Key | Value | Scope |
|-----|-------|-------|
| `NODE_ENV` | `production` | Build & Runtime |
| `PORT` | (leave blank - Render assigns) | Runtime |
| `RENDER` | `true` | Runtime |
| `VITE_API_URL` | `https://obd2-diagnostic-app.onrender.com` | Build |

**Important**: 
- `VITE_API_URL` must be set during build (it's used in the React build)
- `RENDER` helps identify when running on Render's infrastructure
- `PORT` is automatically assigned; don't hardcode it

### Step 5: Deploy

Click **"Create Web Service"** to start the first deployment.

Monitor the build logs:
- **Build phase**: npm dependencies and build scripts run
- **Runtime phase**: Node server starts and serves the app

Once deployment completes:
- Your app is accessible at `https://obd2-diagnostic-app.onrender.com`
- Health check endpoint at `https://obd2-diagnostic-app.onrender.com/health`

## Environment Variables

### Required Variables

```
NODE_ENV=production          # Enable production optimizations
RENDER=true                  # Identifies Render environment
VITE_API_URL=https://obd2-diagnostic-app.onrender.com  # API endpoint
```

### Optional Variables

```
PORT=3001                    # Auto-assigned by Render; shown for reference
LOG_LEVEL=info              # Set to 'debug' for more logs
```

### Setting Variables on Render

1. Go to your service dashboard
2. Click **"Environment"** in the left sidebar
3. Click **"Add Environment Variable"**
4. Enter key and value
5. Click **"Save Changes"**
6. Service automatically redeploys with new variables

**Note**: Changing `VITE_API_URL` requires a rebuild to take effect in the React bundle.

## Build and Runtime Configuration

### Build Process

```bash
npm run build:client    # Runs: cd client && npm install && npm run build
npm run build:server    # Runs: cd server && npm install
```

This:
1. Installs client dependencies
2. Builds React app with Vite (output: `client/dist`)
3. Installs server dependencies
4. Leaves source files in place for runtime

### Runtime Process

```bash
npm start               # Runs: NODE_ENV=production node server/index.js
```

This:
1. Starts Express server on `PORT` (assigned by Render)
2. Serves static React files from `client/dist`
3. Routes API calls to `/api/*`
4. Returns `client/dist/index.html` for client-side routing

### Health Check

Render monitors the `/health` endpoint:

```
GET https://obd2-diagnostic-app.onrender.com/health

Response (200 OK):
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

If health check fails 3 times, Render marks the service as unhealthy.

## Monitoring and Troubleshooting

### View Logs

1. Go to your service dashboard
2. Click **"Logs"** tab
3. View real-time build and runtime logs

### Common Issues

#### Build Fails: "npm: command not found"

- **Cause**: Node.js not installed or PATH misconfigured
- **Fix**: Ensure `runtimeVersion: 18` in `render.yaml` or select Node runtime in dashboard

#### Build Fails: "Cannot find module 'express'"

- **Cause**: Dependencies not installed during build
- **Fix**: Ensure `npm install` runs in server directory
- **Check**: `render.yaml` has `npm run build:server` which runs `cd server && npm install`

#### Frontend Blank or 404 Errors

- **Cause**: React build didn't complete or files not served
- **Fix**: 
  - Check build logs for React build errors
  - Verify `client/dist` exists after build
  - Ensure `app.use(express.static(distPath))` is in `server/index.js`

#### API Requests Return 404

- **Cause**: API routes not found
- **Fix**:
  - Check Express routes are prefixed with `/api`
  - Verify server logs show routes mounting
  - Check CORS configuration

#### CORS Errors

- **Cause**: Origin not in allowlist
- **Fix**: Update `corsConfig.js` to include your Render domain:
  ```javascript
  allowedOrigins = ['https://obd2-diagnostic-app.onrender.com'];
  ```

#### Health Check Failing

- **Cause**: `/health` endpoint not responding
- **Fix**: 
  - Ensure `healthRouter` is imported and used in `server/index.js`
  - Check server logs for startup errors
  - Verify PORT environment variable is being used

### Enable Debug Logging

Set `LOG_LEVEL=debug` environment variable:

1. Dashboard → Environment
2. Add `LOG_LEVEL=debug`
3. Redeploy
4. Check logs for detailed output

### Restart Service

1. Dashboard → Settings
2. Click **"Restart"** button
3. Service redeploys without rebuilding

## Custom Domain Setup

### Add Custom Domain

1. Go to your service dashboard
2. Click **"Settings"** in left sidebar
3. Scroll to **"Custom Domain"**
4. Click **"Add Custom Domain"**
5. Enter your domain (e.g., `obd2.example.com`)
6. Click **"Add"**
7. Note the CNAME target provided

### Configure DNS

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Edit DNS records for your domain
3. Create/update CNAME record:
   - **Host**: `obd2` (or subdomain name)
   - **Value**: `obd2-diagnostic-app.onrender.com`
4. Save and wait for DNS propagation (5-30 minutes)

### Verify Custom Domain

```bash
curl https://obd2.example.com/health
```

Should return the same health response as the Render domain.

## Logs and Debugging

### Render Dashboard Logs

**Build Logs** (Build Phase):
- Shows npm install, build scripts, errors
- Typically 2-5 minutes
- Errors here mean build failed

**Deploy Logs** (Deploy Phase):
- Shows server startup messages
- Check for port binding errors
- Should see "Server running on port 3001"

**Runtime Logs** (After Deployment):
- Shows HTTP requests and responses
- Application errors
- Health checks

### Log Format

```
[2024-01-01T12:00:00.000Z] GET /api/health 200 12ms
[2024-01-01T12:00:05.123Z] [ERROR] Cannot connect to Bluetooth device
```

### Accessing via SSH (Advanced)

Render allows SSH access to services:

```bash
render ssh [SERVICE_NAME]
```

Once connected:
```bash
cd /opt/render/project
npm start         # Start service (if not running)
env              # View environment variables
```

## Database Setup (Future)

When adding a database:

1. Create PostgreSQL or MySQL instance on Render
2. Note the internal database URL
3. Add to environment variables:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```
4. Update `server` code to use the database
5. Run migrations (add to build command if needed)

Example build command with migrations:

```bash
npm run build && cd server && npm run migrate
```

## Redeploy on Code Changes

### Automatic Deployment

- Every push to your default branch automatically deploys
- Default branch is usually `main` or `master`
- Set branch in Dashboard → Settings → Deploy from Branch

### Manual Redeploy

1. Dashboard → your service
2. Click **"Redeploy"** button
3. Choose to redeploy latest commit or rebuild

### Conditional Deployments

To deploy specific branches:

1. Settings → Deploy from Branch
2. Change branch to your deployment branch
3. Now only pushes to that branch trigger deploys

## Rollback and Recovery

### Rollback to Previous Deployment

1. Dashboard → your service
2. Click **"Deployments"** tab
3. Find the working deployment
4. Click **"Redeploy"** on that specific deployment

### Failed Deployment

If deployment fails and service is down:

1. Check build logs for errors
2. Fix code locally
3. Push to GitHub
4. Render auto-redeploys (if automatic deployment enabled)
5. Or manually click **"Redeploy"**

## Performance Tips

1. **Enable Caching**
   - Use `Cache-Control` headers in responses
   - Render caches static assets from `client/dist`

2. **Optimize Images**
   - Use compressed images in frontend
   - Serve WebP format when possible

3. **Monitor Usage**
   - Check Dashboard → Metrics
   - Upgrade to Paid plan if approaching limits

4. **Database Queries**
   - Add indexes to frequently queried columns
   - Use connection pooling

## Conclusion

Your OBD2 diagnostic application is now deployed and accessible on Render! The service automatically redeploys when you push code, monitors health, and provides logs for debugging.

For more information, visit [Render Documentation](https://render.com/docs).
