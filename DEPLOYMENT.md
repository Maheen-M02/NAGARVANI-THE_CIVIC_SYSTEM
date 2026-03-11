# NagarVani - Vercel Deployment Guide

## 🚀 Deployment Configuration

This project is configured for seamless deployment on Vercel with the following optimizations:

### Files Added:
- `vercel.json` - Vercel configuration
- `.nvmrc` - Node.js version specification
- `.vercelignore` - Files to exclude from deployment

## 🔧 Vercel Configuration

### Key Settings:
- **Node.js Version**: 18.x (stable and widely supported)
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm ci` (faster, more reliable)
- **Framework**: Create React App

### Build Optimizations:
- `CI=false` in build script to ignore warnings as errors
- Static file caching with long-term cache headers
- SPA routing configuration for React Router

## 🛠 Troubleshooting Vercel Deployment Issues

### Common Issues & Solutions:

#### 1. **Permission Denied Error (Exit Code 126)**
**Problem**: `sh: line 1: /vercel/path0/node_modules/.bin/react-scripts: Permission denied`

**Solutions**:
- ✅ Use `npm ci` instead of `npm install` (configured in vercel.json)
- ✅ Set Node.js version to 18.x (more stable than 24.x)
- ✅ Add `CI=false` to build script to ignore warnings
- ✅ Use proper vercel.json configuration

#### 2. **Build Timeout**
**Problem**: Build takes too long and times out

**Solutions**:
- Use `npm ci` for faster dependency installation
- Optimize bundle size
- Remove unused dependencies

#### 3. **Environment Variables**
**Problem**: Missing environment variables in production

**Solutions**:
- Add environment variables in Vercel dashboard
- Use `.env.production` for production-specific variables
- Ensure variables are prefixed with `REACT_APP_`

#### 4. **Routing Issues**
**Problem**: 404 errors on page refresh

**Solutions**:
- ✅ Configured SPA routing in vercel.json
- All routes redirect to index.html
- Static assets served with proper caching

## 📋 Deployment Checklist

Before deploying to Vercel:

- [ ] Ensure all dependencies are in package.json
- [ ] Test build locally: `npm run build`
- [ ] Check for any console errors or warnings
- [ ] Verify environment variables are set
- [ ] Test the built app: `npx serve -s build`

## 🚀 Deploy to Vercel

### Method 1: Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

### Method 2: GitHub Integration
1. Push code to GitHub
2. Connect repository in Vercel dashboard
3. Deploy automatically on push

### Method 3: Drag & Drop
1. Run `npm run build`
2. Drag the `build` folder to Vercel dashboard

## 🔍 Monitoring

After deployment:
- Check Vercel function logs for any runtime errors
- Monitor performance in Vercel analytics
- Test all language switching functionality
- Verify all routes work correctly

## 🌐 Multi-Language Support

The app supports 12 Indian languages and should work correctly in production with:
- Proper font loading for all scripts
- Language detection and switching
- Persistent language preferences

## 📞 Support

If deployment issues persist:
1. Check Vercel build logs for specific errors
2. Verify Node.js version compatibility
3. Test build locally first
4. Check for any missing dependencies

---

**Ready for production deployment with full multi-language support!**