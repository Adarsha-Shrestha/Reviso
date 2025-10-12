# Quick Setup Guide

## Step-by-Step Installation

### 1. Clone or Extract the Project

\`\`\`bash
# If you have the project as a ZIP
unzip educational-rag-platform.zip
cd educational-rag-platform
\`\`\`

### 2. Backend Setup (5 minutes)

\`\`\`bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install fastapi uvicorn openai pinecone-client opencv-python mediapipe ultralytics pyaudio numpy pillow python-multipart

# Create .env file
cat > .env << EOF
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_environment_here
PINECONE_INDEX_NAME=your_index_name_here
EOF

# Download YOLO model (if not included)
# The yolov8m.pt will be auto-downloaded on first run
# Place your anti-spoofing model (best.pt) in this directory

# Start the backend
python main.py
\`\`\`

**Backend should now be running on http://localhost:8000**

### 3. Frontend Setup (3 minutes)

Open a new terminal:

\`\`\`bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

**Frontend should now be running on http://localhost:3000**

### 4. Verify Installation

1. Open browser to `http://localhost:3000`
2. You should see the Reviso home page
3. Try navigating to Chat, Quiz, or Flashcards
4. For proctored quiz, allow camera access when prompted

## Quick Test

### Test Chat
1. Go to Chat page
2. Select "DataMining" subject
3. Type: "What is a decision tree?"
4. You should get an AI response

### Test Quiz
1. Go to Quiz page
2. Enter topic: "Machine Learning"
3. Click "Generate Quiz"
4. Answer questions

### Test Proctoring
1. Go to Quiz → Proctored Quiz
2. Enter username: "testuser"
3. Configure quiz settings
4. Click "Start Proctored Quiz"
5. Allow camera access
6. You should see your video feed with proctoring overlays

## Common Issues

### Backend won't start
- Check if port 8000 is available
- Verify Python version: `python --version` (need 3.8+)
- Install missing dependencies

### Frontend won't start
- Check if port 3000 is available
- Verify Node version: `node --version` (need 18+)
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Camera not working
- Allow camera permissions in browser
- Close other apps using camera
- Check if OpenCV is installed: `python -c "import cv2"`

### API connection errors
- Ensure backend is running on port 8000
- Check browser console for CORS errors
- Verify API_BASE URL in frontend code

## Next Steps

1. Populate Pinecone with your course documents
2. Customize subjects and topics
3. Adjust proctoring settings
4. Deploy to production (see README.md)

## Need Help?

- Check full README.md for detailed documentation
- Visit http://localhost:8000/docs for API documentation
- Review backend logs for error messages
