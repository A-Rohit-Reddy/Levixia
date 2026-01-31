# Troubleshooting: "Cannot POST" HTML Error

## ✅ Files Are Fixed

Both `server/index.js` and `server/routes/assistantRoutes.js` have been updated with:
- ✅ Proper route registration
- ✅ JSON error handlers (no HTML)
- ✅ Multer configured correctly
- ✅ Mock mode enabled

## 🔍 Debugging Steps

### Step 1: Verify Server is Running
```bash
cd "C:\Users\Rohit Reddy\Documents\Levixia\levixia"
npm run server
```

**Expected output:**
```
✅ assistantRoutes loaded
✅ aiRoutes loaded
🚀 Backend server running on http://localhost:3001
📡 Assistant endpoints available at /api/assistant/*
📡 Test endpoint: POST http://localhost:3001/api/assistant/test
📡 Speech-to-text: POST http://localhost:3001/api/assistant/speech-to-text
✅ Routes registered successfully
```

### Step 2: Test the Server Directly

**Test 1: Root endpoint (should work)**
```bash
# In browser or Postman:
GET http://localhost:3001/
```
Should return: `{"message":"Backend server is running!"}`

**Test 2: Test route (should work)**
```bash
# Using curl or Postman:
POST http://localhost:3001/api/assistant/test
Content-Type: application/json
Body: {"test": "data"}
```
Should return: `{"message":"Test route works!","received":{"test":"data"},"timestamp":"..."}`

**Test 3: Speech-to-text route**
```bash
POST http://localhost:3001/api/assistant/speech-to-text
Content-Type: multipart/form-data
Form data: audio file (or empty)
```

### Step 3: Check Server Console

When you make a request, you should see:
```
📡 [POST] /api/assistant/speech-to-text
✅ POST /api/assistant/speech-to-text was hit!
📦 Request body: { ... }
📦 File received: No file (or file details)
```

**If you DON'T see these logs:**
- The request isn't reaching the server
- Check CORS settings
- Check if server is actually running on port 3001

### Step 4: Check Frontend API Call

In `src/services/apiService.js`, verify:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
```

Make sure it's `3001`, not `5000` or `3000`.

### Step 5: Common Issues

**Issue: "Cannot POST" HTML page**
- ✅ **FIXED**: 404 handler now returns JSON
- If still seeing HTML, the server might not have restarted with new code

**Issue: CORS error in browser console**
- ✅ **FIXED**: CORS configured for `http://localhost:3000`
- If still seeing CORS errors, check browser console for exact error

**Issue: Port mismatch**
- ✅ **FIXED**: Server uses port 3001, frontend expects 3001
- Verify `server/.env` has `PORT=3001`

## 🚀 Restart Instructions

**CRITICAL: You MUST restart the server after changes!**

1. **Stop the current server** (Ctrl+C in terminal)
2. **Start it again:**
   ```bash
   cd "C:\Users\Rohit Reddy\Documents\Levixia\levixia"
   npm run server
   ```
3. **Verify it starts without errors**
4. **Test the endpoint** from your React app

## 📝 What Was Changed

1. **server/index.js:**
   - Port set to 3001
   - Added route loading error handling
   - Added request logging middleware
   - 404 handler returns JSON (not HTML)
   - Error handler returns JSON (not HTML)

2. **server/routes/assistantRoutes.js:**
   - Simplified multer configuration
   - Made file upload optional (won't fail if no file)
   - Added test route for debugging
   - Mock mode always enabled

3. **server/.env:**
   - `PORT=3001`
   - `MOCK_TRANSCRIPTION=true`

## ✅ Expected Behavior

When you call `POST http://localhost:3001/api/assistant/speech-to-text`:

**Response (JSON):**
```json
{
  "success": true,
  "transcript": "This is a mock transcription response...",
  "confidence": 0.95,
  "rawResponse": { "mock": true },
  "fileReceived": null
}
```

**NOT an HTML page!**

If you're still getting HTML, the server hasn't restarted with the new code.
