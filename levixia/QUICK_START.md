# Quick Start - Backend Setup

## Fix Applied ✅

The backend errors have been fixed:

1. ✅ Fixed API key environment variable name
2. ✅ Added dotenv to load .env file
3. ✅ Made service handle missing keys gracefully

## Setup Steps

1. **Create `server/.env` file:**
   ```
   GOOGLE_API_KEY=AIzaSyBD79e9UnXPqzsxZOk0JK6S7SgFecm2Hxg
   PORT=5000
   ```

2. **Start the backend:**
   ```bash
   npm run server
   ```

   You should see:
   ```
   🚀 Backend server running on http://localhost:5000
   ✅ Google Gemini API key configured
   ✅ Gemini service initialized
   ```

3. **Test the server:**
   Open browser: http://localhost:5000/api/health

## If You Still Get Errors

- Make sure `server/.env` exists with `GOOGLE_API_KEY=your_key`
- Check that port 5000 is not already in use
- Verify Node.js version: `node --version` (should be 14+)

## Running Both Frontend and Backend

Terminal 1:
```bash
npm run server
```

Terminal 2:
```bash
npm start
```

Or use concurrently (if installed):
```bash
npm run dev
```
