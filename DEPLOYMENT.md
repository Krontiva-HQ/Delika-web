# Vercel Deployment Guide

## Issue: 404 NOT_FOUND Error

If you're getting a 404 error on Vercel, follow these steps to resolve it:

### 1. Verify Configuration Files

The following files have been updated for proper Vercel deployment:

- ✅ `package.json` - Fixed formatting and build scripts
- ✅ `vercel.json` - Updated for React/Vite static build
- ✅ `vite.config.ts` - Properly configured for production build

### 2. Build Process

Your project uses Vite for building. The build process:
1. Runs `tsc` (TypeScript compilation)
2. Runs `vite build` (creates static files in `dist/` directory)
3. Vercel serves files from `dist/` directory

### 3. Environment Variables

Make sure to set these environment variables in your Vercel dashboard:

```
VITE_API_BASE_URL=https://api-server.krontiva.africa
VITE_AUTH_TOKEN=your_auth_token_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. Deployment Steps

1. **Push your changes to GitHub**
2. **Connect your repository to Vercel** (if not already done)
3. **Set environment variables** in Vercel dashboard
4. **Deploy** - Vercel will automatically build and deploy

### 5. Troubleshooting

If you still get 404 errors:

1. **Check build logs** in Vercel dashboard
2. **Verify the `dist/` folder** is created during build
3. **Check that `index.html`** exists in the `dist/` folder
4. **Ensure all static assets** are properly referenced

### 6. Local Testing

Test the build locally before deploying:

```bash
npm run build
npm run preview
```

This should create a `dist/` folder and serve your app locally.

### 7. API Routes

Your API routes are configured in:
- `api/[...path].js` - Main API proxy
- `api/proxy.js` - Additional proxy configuration

These should work correctly with the updated `vercel.json` configuration.

### 8. Client-Side Routing

React Router routes are handled by the catch-all route in `vercel.json`:
```json
{
  "src": "/((?!api/).*)",
  "dest": "/index.html"
}
```

This ensures all non-API routes serve the React app for client-side routing. 