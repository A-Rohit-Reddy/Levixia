# Backend Setup Instructions

## Prerequisites
- Node.js 14+ installed
- Google Gemini API key

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env and add your GOOGLE_API_KEY
   ```

3. **Start the backend server:**
   ```bash
   npm run server
   ```

   The server will run on `http://localhost:5000`

4. **Start frontend and backend together:**
   ```bash
   npm run dev
   ```

## API Endpoints

All AI operations are handled by the backend:

- `POST /api/ai/reading-passage` - Generate reading passage
- `POST /api/ai/analyze-reading` - Analyze reading performance
- `POST /api/ai/analyze-spelling` - Analyze spelling errors
- `POST /api/ai/analyze-visual` - Analyze visual test
- `POST /api/ai/analyze-cognitive` - Analyze cognitive test
- `POST /api/ai/generate-report` - Generate holistic report
- `GET /api/ai/spelling-words` - Get word pool for spelling test

## Backend Logs

The backend logs all AI operations clearly:
- `🧠 Gemini invoked for <task>` - When AI is called
- `✅ Gemini completed <task> in <ms>ms` - When AI completes
- `❌ Gemini failed for <task>` - When AI fails

## Important Notes

- **ALL AI operations happen in the backend**
- API keys are stored in backend `.env` file only
- Frontend makes HTTP requests to backend APIs
- AI usage is visible in network tab and backend logs
