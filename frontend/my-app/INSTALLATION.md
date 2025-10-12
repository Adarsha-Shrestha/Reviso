# Quick Installation Guide

## Fix Dependency Issues

The project had a dependency conflict with `vaul` (drawer component) that didn't support React 19. This has been resolved by removing the unused dependency.

## Installation Steps

### 1. Install Frontend Dependencies

\`\`\`bash
cd front  # or your Next.js directory
npm install
\`\`\`

If you still encounter issues, try:
\`\`\`bash
npm install --legacy-peer-deps
\`\`\`

Or clean install:
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

### 2. Install Backend Dependencies

\`\`\`bash
cd backend  # or your FastAPI directory
pip install -r requirements.txt
\`\`\`

Or install manually:
\`\`\`bash
pip install fastapi uvicorn openai pinecone-client opencv-python mediapipe ultralytics pyaudio numpy pillow python-multipart pydantic python-dotenv
\`\`\`

### 3. Configure Environment Variables

Create a `.env` file in your backend directory:

\`\`\`env
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment
\`\`\`

### 4. Start the Backend

\`\`\`bash
cd backend
python main.py
\`\`\`

Backend will run on `http://localhost:8000`

### 5. Start the Frontend

Open a new terminal:

\`\`\`bash
cd front
npm run dev
\`\`\`

Frontend will run on `http://localhost:3000`

## Verify Installation

1. Open `http://localhost:3000` in your browser
2. You should see the homepage with three main features:
   - AI Chat with RAG
   - Quiz Generator
   - Flashcard Studio
   - Proctored Quiz (with camera monitoring)

## Troubleshooting

### Frontend Issues

**Problem**: `npm install` fails with dependency errors
**Solution**: 
\`\`\`bash
npm install --legacy-peer-deps
\`\`\`

**Problem**: Port 3000 already in use
**Solution**:
\`\`\`bash
npm run dev -- -p 3001
\`\`\`

### Backend Issues

**Problem**: Missing Python packages
**Solution**:
\`\`\`bash
pip install --upgrade pip
pip install -r requirements.txt
\`\`\`

**Problem**: Port 8000 already in use
**Solution**: Change port in `main.py`:
\`\`\`python
uvicorn.run(app, host="0.0.0.0", port=8001)
\`\`\`

**Problem**: Camera not working for proctoring
**Solution**: 
- Grant browser camera permissions
- Check if camera is being used by another application
- Try a different browser (Chrome recommended)

### API Connection Issues

**Problem**: Frontend can't connect to backend
**Solution**:
- Verify backend is running on `http://localhost:8000`
- Check CORS settings in backend
- Verify API endpoints in frontend match backend routes

## System Requirements

- **Node.js**: 18.x or higher
- **Python**: 3.8 or higher
- **Camera**: Required for proctoring feature
- **Microphone**: Required for audio detection in proctoring
- **RAM**: Minimum 8GB (16GB recommended for YOLO models)

## Next Steps

1. Test the AI Chat feature with sample questions
2. Generate a quiz and try the proctored mode
3. Create flashcards and start a study session
4. Review the proctoring statistics after completing a quiz

For detailed documentation, see `README.md` and `SETUP_GUIDE.md`.
