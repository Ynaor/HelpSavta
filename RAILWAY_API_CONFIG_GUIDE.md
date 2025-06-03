# Railway API Configuration Guide

This guide explains how to fix the API configuration for Railway deployment where frontend and backend are deployed as separate services.

## Problem
- Frontend uses hardcoded `baseURL: '/api'` which works in development with Vite proxy
- In Railway production, frontend and backend are separate services
- Static file server can't proxy `/api` requests to backend service
- Results in 404 errors for all API calls

## Solution
Environment-based API URL configuration that uses full backend service URL in production.

## Files Modified

### 1. `frontend/src/services/api.ts`
- Updated to use `import.meta.env.VITE_API_URL` with fallback to `/api` for development
- Added logging to show which API URL is being used

### 2. `frontend/src/vite-env.d.ts` (created)
- TypeScript definitions for Vite environment variables
- Defines `VITE_API_URL` as optional string

### 3. `frontend/.env.example` (created)
- Documents the required environment variable
- Provides examples for development and production usage

### 4. `frontend/Dockerfile`
- Added build-time environment variable support
- Accepts `VITE_API_URL` as build argument and passes to build process

## Railway Deployment Instructions

### Step 1: Deploy Backend Service
1. Deploy your backend service to Railway
2. Note the generated URL (e.g., `https://your-backend-service.up.railway.app`)

### Step 2: Configure Frontend Service
1. In Railway dashboard, go to your frontend service
2. Go to **Variables** tab
3. Add environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: Choose one of the following options:
   
   **Option A - Public URL (Recommended):**
   ```
   https://your-backend-service.up.railway.app/api
   ```
   
   **Option B - Railway Internal URL:**
   ```
   https://backend.railway.internal/api
   ```
   
   Replace `your-backend-service` with your actual backend service URL for Option A.

### Step 3: Redeploy Frontend
1. After setting the environment variable, redeploy your frontend service
2. Railway will rebuild with the new environment variable

## How It Works

### Development
- `VITE_API_URL` is not set or empty
- API calls use `/api` which is proxied by Vite dev server to `http://localhost:3001`
- Vite proxy configuration in `vite.config.ts` handles the routing

### Production
- `VITE_API_URL` is set to full backend service URL
- API calls go directly to the backend service
- No proxy needed since we're using the full URL

## Verification

### Check API URL in Browser Console
The application logs which API URL it's using:
- Development: `🌐 [API] Using development API URL: /api (with Vite proxy)`
- Production: `🌐 [API] Using environment API URL: https://your-backend-service.up.railway.app/api`

### Test API Connectivity
1. Open browser developer tools
2. Go to Network tab
3. Perform any action that makes an API call
4. Verify requests are going to the correct URL

## Railway Internal vs Public URLs

### When to Use Internal URLs
Railway internal URLs (`*.railway.internal`) can be used for service-to-service communication within Railway:
- **Pros**: Lower latency, no external bandwidth usage
- **Cons**: Only works when both services are on Railway, requires proper internal networking setup

### When to Use Public URLs (Recommended)
Public URLs (`*.up.railway.app`) work for all scenarios:
- **Pros**: Always accessible, easier to debug, works across different hosting providers
- **Cons**: Slightly higher latency, uses external bandwidth

### Important: Railway Internal URL Format
If using Railway internal URLs, you **MUST** include:
1. **Protocol**: `https://` (required)
2. **Full path**: `/api` (required)

❌ **WRONG**: `backend.railway.internal`
✅ **CORRECT**: `https://backend.railway.internal/api`

## Troubleshooting

### Common Issues

1. **Missing protocol and/or path in Railway URL**
   - Symptom: API calls fail with network errors
   - Common mistake: Setting `VITE_API_URL=backend.railway.internal`
   - Solution: Use full URL format: `https://backend.railway.internal/api`

2. **Environment variable not set in Railway**
   - Symptom: Still getting 404 errors
   - Solution: Double-check `VITE_API_URL` is set in Railway frontend service variables

3. **CORS configuration issues**
   - Symptom: "No 'Access-Control-Allow-Origin' header is present" errors
   - Solution: Configure backend `FRONTEND_URL` environment variable to match your frontend domain
   - See CORS Configuration section below

4. **Wrong backend URL**
   - Symptom: CORS errors or connection timeouts
   - Solution: Verify the backend service URL is correct and accessible

5. **Build-time vs Runtime variables**
   - Important: Vite environment variables are embedded at build time
   - Must redeploy frontend service after changing `VITE_API_URL`

6. **Railway internal networking not working**
   - Symptom: Timeouts when using `*.railway.internal` URLs
   - Solution: Switch to public URL format: `https://your-backend-service.up.railway.app/api`

## Proxy Trust Configuration

Railway uses reverse proxies (load balancers) that set the `X-Forwarded-For` header to identify the original client IP. The Express server needs to be configured to trust these proxies for rate limiting to work correctly.

### The Problem
Without proper proxy trust configuration, you may encounter this error:
```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false (default)
Code: ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
```

### The Solution
The application automatically configures proxy trust based on the environment:

- **Production/Staging**: Trusts the first proxy (Railway's load balancer)
- **Development**: Doesn't trust any proxies by default

### Environment Variable
You can override the default behavior by setting the `TRUST_PROXY` environment variable:

- `TRUST_PROXY=false` - Don't trust any proxies (default for development)
- `TRUST_PROXY=true` - Trust all proxies (not recommended for security)
- `TRUST_PROXY=1` - Trust the first proxy only (recommended for Railway)
- `TRUST_PROXY=2` - Trust the first 2 proxies

### Railway Configuration
For Railway deployment, the recommended setting is already configured in the production environment template:
```
TRUST_PROXY=1
```

This tells Express to trust Railway's load balancer, allowing rate limiting and other middleware to work correctly with the real client IP addresses.

## CORS Configuration

For Railway deployment, you must configure CORS on the backend to allow requests from your frontend domain.

### Backend CORS Setup

1. **Set Frontend URL Environment Variable** (Required)
   In your Railway backend service, add:
   ```
   FRONTEND_URL=https://frontend-production-72eb.up.railway.app
   ```
   Replace with your actual frontend Railway domain.

2. **Optional: Multiple Origins**
   If you need to allow multiple domains:
   ```
   ALLOWED_ORIGINS=https://yourdomain.com,https://frontend-production-72eb.up.railway.app
   ```

### How CORS Works in the Application

- **Development**: CORS allows all origins (`origin: true`)
- **Production**: CORS only allows specified origins from `FRONTEND_URL` or `ALLOWED_ORIGINS`
- **Credentials**: CORS is configured to support cookies/sessions (`credentials: true`)
- **Methods**: Supports GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Allows Content-Type, Authorization, X-Requested-With

### CORS Troubleshooting

1. **Verify Backend Environment Variables**
   - Check that `FRONTEND_URL` is set correctly in Railway backend service
   - Ensure the URL matches exactly (including protocol: `https://`)
   - No trailing slashes in the URL

2. **Check CORS Headers**
   - Use browser dev tools → Network tab
   - Look for `Access-Control-Allow-Origin` header in API responses
   - Should match your frontend domain

3. **Test CORS Preflight**
   - Complex requests trigger OPTIONS preflight requests
   - Verify OPTIONS requests are successful (200 status)
   - Check for proper CORS headers in OPTIONS response

### Getting Backend Service URL
1. In Railway dashboard, go to your backend service
2. Go to **Settings** tab
3. Look for **Domains** section
4. Copy the generated domain (e.g., `your-backend-service.up.railway.app`)
5. Add `/api` suffix for the frontend environment variable

## Example Configuration

For a Railway deployment with:
- Backend service: `helpsavta-backend.up.railway.app`
- Frontend service: `helpsavta-frontend.up.railway.app`

Frontend environment variable should be:
```
VITE_API_URL=https://helpsavta-backend.up.railway.app/api
```

## Local Development
No changes needed for local development:
- Keep `VITE_API_URL` empty or unset in local `.env` file
- Vite proxy will continue to work as before
- Backend should run on `http://localhost:3001`