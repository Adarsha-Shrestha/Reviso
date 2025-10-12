# Troubleshooting Guide

## Module Not Found Error: Can't resolve '@/components/ui/button'

If you're seeing this error, it means the dependencies weren't fully installed. Follow these steps:

### Solution 1: Clean Install (Recommended)

\`\`\`bash
# Stop the dev server (Ctrl+C)

# Remove existing dependencies
rm -rf node_modules
rm package-lock.json

# Install dependencies
npm install

# Start the dev server
npm run dev
\`\`\`

### Solution 2: Clear Next.js Cache

\`\`\`bash
# Stop the dev server (Ctrl+C)

# Clear Next.js cache
rm -rf .next

# Start the dev server
npm run dev
\`\`\`

### Solution 3: Verify Installation

Check that these key dependencies are installed:

\`\`\`bash
npm list @radix-ui/react-slot
npm list class-variance-authority
npm list clsx
npm list tailwind-merge
npm list lucide-react
\`\`\`

If any are missing, install them:

\`\`\`bash
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react
\`\`\`

## Common Issues

### 1. Port Already in Use

If port 3000 is already in use:

\`\`\`bash
# Kill the process using port 3000
# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Or use a different port:
npm run dev -- -p 3001
\`\`\`

### 2. TypeScript Errors

If you see TypeScript errors, try:

\`\`\`bash
# Restart TypeScript server in VS Code
# Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
# Type: "TypeScript: Restart TS Server"

# Or ignore during development (already configured in next.config.mjs)
\`\`\`

### 3. Backend Connection Issues

If the frontend can't connect to the backend:

1. Verify backend is running on `http://localhost:8000`
2. Check CORS is enabled in the backend
3. Verify the API endpoints match the backend routes

\`\`\`bash
# Test backend is running:
curl http://localhost:8000/docs
\`\`\`

### 4. Styling Issues

If styles aren't loading:

\`\`\`bash
# Verify Tailwind CSS is working
npm run dev

# Check that globals.css is imported in layout.tsx
# Check that tailwind.config.js exists
\`\`\`

## Step-by-Step Fresh Start

If nothing works, start completely fresh:

\`\`\`bash
# 1. Stop all running processes
# Press Ctrl+C in all terminals

# 2. Clean everything
rm -rf node_modules
rm -rf .next
rm package-lock.json

# 3. Install dependencies
npm install

# 4. Start dev server
npm run dev

# 5. In a separate terminal, start the backend
cd ../backend
python main.py
\`\`\`

## Verification Checklist

- [ ] Node.js version 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Dependencies installed (`node_modules` folder exists)
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] No TypeScript errors in terminal
- [ ] Browser console shows no errors

## Still Having Issues?

1. Check the browser console (F12) for detailed error messages
2. Check the terminal for build errors
3. Verify all files are in the correct locations
4. Make sure you're in the correct directory (`front` folder)
5. Try restarting your code editor

## Quick Fix Commands

\`\`\`bash
# Complete reset and restart
rm -rf node_modules .next package-lock.json && npm install && npm run dev
\`\`\`

For Windows PowerShell:
```powershell
Remove-Item -Recurse -Force node_modules, .next, package-lock.json; npm install; npm run dev
