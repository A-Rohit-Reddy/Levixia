# Backend Server Setup Guide

## ✅ Your Server Structure

You **DO** have a server folder with the following structure:
```
levixia/
├── server/
│   ├── index.js          ✅ Main server file
│   ├── routes/
│   │   ├── aiRoutes.js
│   │   └── assistantRoutes.js  ✅ Contains /api/assistant/speech-to-text
│   └── services/
│       └── ... (various services)
└── package.json          ✅ Dependencies already installed
```

## 📦 Dependencies Status

**GOOD NEWS:** All required packages are **already installed** in your root `package.json`:
- ✅ `express` (v4.22.1)
- ✅ `cors` (v2.8.6)
- ✅ `multer` (v2.0.2)
- ✅ `dotenv` (v17.2.3)
- ✅ `reverie-client` (v0.1.2)

**You do NOT need to install anything!** The packages are installed at the project root level.

## 🚀 How to Start the Server

### Option 1: Using npm script (Recommended)
```bash
cd "C:\Users\Rohit Reddy\Documents\Levixia\levixia"
npm run server
```

### Option 2: Direct node command
```bash
cd "C:\Users\Rohit Reddy\Documents\Levixia\levixia"
node server/index.js
```

### Option 3: Using nodemon (if installed globally)
```bash
cd "C:\Users\Rohit Reddy\Documents\Levixia\levixia"
nodemon server/index.js
```

## 🧪 Testing with Mock Response

To test the connection **without** calling the Reverie API, enable mock mode:

1. Create or edit `server/.env` file:
```bash
# Create this file: levixia/server/.env
MOCK_TRANSCRIPTION=true
PORT=5000
```

2. Start the server (see above)

3. The `/api/assistant/speech-to-text` endpoint will return a mock response:
```json
{
  "success": true,
  "transcript": "This is a mock transcription response for testing...",
  "confidence": 0.95,
  "rawResponse": { "mock": true }
}
```

## 🔍 Verify Server is Running

1. **Check the console output:**
   ```
   🚀 Backend server running on http://localhost:5000
   📡 AI endpoints available at /api/ai/*
   ```

2. **Test the health endpoint:**
   Open browser: http://localhost:5000/api/health
   Should return: `{"status":"ok","timestamp":"..."}`

3. **Test from your React app:**
   The frontend should now be able to connect!

## 🐛 Troubleshooting

### Error: "Cannot find module 'express'"
**Solution:** Run `npm install` in the project root:
```bash
cd "C:\Users\Rohit Reddy\Documents\Levixia\levixia"
npm install
```

### Error: "Port 5000 already in use"
**Solution:** Either:
1. Stop the other process using port 5000, OR
2. Change the port in `server/.env`:
   ```
   PORT=5001
   ```
   Then update your frontend `API_BASE_URL` to match.

### Error: "ERR_CONNECTION_REFUSED"
**Solution:** Make sure:
1. ✅ Server is actually running (check console for startup message)
2. ✅ Server is on port 5000 (check console output)
3. ✅ CORS is configured (already done in `server/index.js`)
4. ✅ Frontend is trying to connect to `http://localhost:5000`

## 📝 Running Both Frontend and Backend

You need **TWO terminal windows**:

**Terminal 1 - Backend:**
```bash
cd "C:\Users\Rohit Reddy\Documents\Levixia\levixia"
npm run server
```

**Terminal 2 - Frontend:**
```bash
cd "C:\Users\Rohit Reddy\Documents\Levixia\levixia"
npm start
```

Or use the combined command (if you have `concurrently` installed):
```bash
npm run dev
```

## ✅ What Was Fixed

1. ✅ Removed duplicate `app.listen()` call
2. ✅ Fixed duplicate CORS configuration
3. ✅ Added mock mode for testing
4. ✅ Added proper error handling
5. ✅ Added logging middleware

Your server is ready to go! 🎉
