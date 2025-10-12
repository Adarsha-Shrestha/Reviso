# Reviso - AI-Powered Educational Platform

A complete full-stack educational platform with RAG (Retrieval Augmented Generation) chat, quiz generation, flashcard creation, and AI-powered proctoring system.

## Features

### 1. AI Chat Assistant
- RAG-powered chat with course materials
- Context-aware responses from Pinecone vector database
- Support for DataMining, Network, and Distributed Computing subjects

### 2. Smart Quiz Generator
- Generate custom quizzes on any topic
- Multiple difficulty levels (easy, medium, hard)
- Instant feedback and explanations
- Score tracking and review

### 3. Flashcard Studio
- AI-generated flashcards from course content
- Interactive flip animations
- Study session tracking
- Difficulty-based filtering

### 4. AI Proctoring System
- Real-time camera monitoring
- Eye tracking and gaze detection
- Head pose estimation
- Multiple person detection
- Unauthorized material detection (books, phones)
- Audio monitoring
- Anti-spoofing detection
- Automatic violation recording
- Detailed statistics and reports

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Language**: TypeScript

### Backend
- **Framework**: FastAPI (Python)
- **AI/ML**: OpenAI GPT, YOLO v8, MediaPipe
- **Vector Database**: Pinecone
- **Computer Vision**: OpenCV, Ultralytics
- **Audio Processing**: PyAudio

## Prerequisites

### Backend Requirements
- Python 3.8+
- OpenCV
- YOLO models (yolov8m.pt, best.pt)
- Webcam for proctoring
- Microphone for audio detection

### Frontend Requirements
- Node.js 18+
- npm or yarn

## Installation

### 1. Backend Setup

#### Install Python Dependencies

\`\`\`bash
cd backend
pip install fastapi uvicorn openai pinecone-client opencv-python mediapipe ultralytics pyaudio numpy pillow python-multipart
\`\`\`

#### Download YOLO Models

Place the following models in your backend directory:
- `yolov8m.pt` - For object detection (person, book, phone)
- `best.pt` - For anti-spoofing detection

You can download yolov8m.pt from: https://github.com/ultralytics/ultralytics

#### Set Environment Variables

Create a `.env` file in the backend directory:

\`\`\`env
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=your_index_name
\`\`\`

#### Run the Backend

\`\`\`bash
# From the backend directory
python main.py

# Or with uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
\`\`\`

The backend will start on `http://localhost:8000`

### 2. Frontend Setup

#### Install Dependencies

\`\`\`bash
# Navigate to the frontend directory (where package.json is)
cd frontend

# Install dependencies
npm install
\`\`\`

#### Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

The frontend will start on `http://localhost:3000`

## Project Structure

\`\`\`
educational-rag-platform/
├── backend/
│   ├── main.py                 # FastAPI main application
│   ├── proctoring.py          # Proctoring system implementation
│   ├── api/
│   │   ├── chat.py            # Chat endpoints
│   │   ├── quiz.py            # Quiz endpoints (app2.py)
│   │   ├── flashcard.py       # Flashcard endpoints (app3.py)
│   │   └── proctoring.py      # Proctoring endpoints
│   ├── yolov8m.pt             # YOLO model for object detection
│   ├── best.pt                # Anti-spoofing model
│   └── cheating_recordings/   # Recorded violation videos
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Home page
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   ├── chat/
│   │   │   └── page.tsx       # Chat interface
│   │   ├── quiz/
│   │   │   ├── page.tsx       # Quiz generator
│   │   │   └── proctored/
│   │   │       └── page.tsx   # Proctored quiz
│   │   └── flashcards/
│   │       └── page.tsx       # Flashcard studio
│   ├── components/
│   │   └── ui/                # shadcn/ui components
│   └── package.json
│
└── README.md
\`\`\`

## Usage

### Starting the System

1. **Start the Backend** (Terminal 1):
   \`\`\`bash
   cd backend
   python main.py
   \`\`\`

2. **Start the Frontend** (Terminal 2):
   \`\`\`bash
   cd frontend
   npm run dev
   \`\`\`

3. **Access the Application**:
   Open your browser and navigate to `http://localhost:3000`

### Using the Chat Feature

1. Navigate to the Chat page
2. Select a subject (DataMining, Network, or Distributed)
3. Type your question
4. Get AI-powered answers from your course materials

### Creating a Quiz

1. Navigate to the Quiz page
2. Enter a topic (e.g., "Decision Trees", "TCP/IP")
3. Select subject and number of questions
4. Click "Generate Quiz"
5. Answer questions and get instant feedback

### Taking a Proctored Quiz

1. Navigate to Quiz → Proctored Quiz
2. Enter your username
3. Configure quiz settings (subject, difficulty, questions)
4. Click "Start Proctored Quiz"
5. Allow camera and microphone access
6. Complete the quiz while being monitored
7. View your results and proctoring statistics

### Creating Flashcards

1. Navigate to the Flashcards page
2. Enter a topic
3. Select subject and number of flashcards
4. Click "Generate Flashcards"
5. Study with interactive flip cards

## API Endpoints

### Chat API
- `POST /api/chat/message` - Send chat message

### Quiz API
- `POST /api/quiz/generate` - Generate quiz
- `POST /api/quiz/session/{id}/answer` - Submit answer
- `POST /api/quiz/session/{id}/submit` - Submit complete quiz

### Flashcard API
- `POST /api/flashcard/generate` - Generate flashcards
- `POST /api/flashcard/study/start` - Start study session

### Proctoring API
- `POST /api/proctoring/start` - Start proctoring
- `POST /api/proctoring/stop` - Stop proctoring
- `GET /api/proctoring/status` - Get proctoring status
- `GET /api/proctoring/video_feed/{username}` - Stream video feed
- `GET /api/proctoring/user_data/{username}` - Get user data
- `GET /api/proctoring/statistics/{username}` - Get statistics
- `GET /api/proctoring/recordings` - List recordings
- `GET /api/proctoring/settings` - Get settings
- `POST /api/proctoring/settings` - Update settings

## Proctoring System Details

### Detection Modules

1. **Eye Tracking**: Monitors gaze direction using iris position
2. **Head Pose**: Detects head rotation and orientation
3. **Audio Detection**: Monitors for sound above threshold
4. **Person Detection**: Identifies multiple people in frame
5. **Object Detection**: Detects books and phones
6. **Anti-Spoofing**: Prevents photo/video spoofing

### Violation Recording

- Violations are recorded when 2+ detection modules flag cheating
- Minimum recording duration: 3 seconds
- Videos saved to `cheating_recordings/` directory
- Filename format: `cheating_TIMESTAMP_durationXs_FLAGS.mp4`

### Statistics

Access detailed statistics including:
- Total cheating instances
- Cheating percentage
- Time-series data
- Violation types
- Exam completion status

## Troubleshooting

### Backend Issues

**Port already in use:**
\`\`\`bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn main:app --port 8001
\`\`\`

**Camera not working:**
- Ensure no other application is using the camera
- Check camera permissions
- Verify OpenCV installation: `python -c "import cv2; print(cv2.__version__)"`

**YOLO models not found:**
- Download models and place in backend directory
- Check file paths in `proctoring.py`

### Frontend Issues

**API connection failed:**
- Verify backend is running on `http://localhost:8000`
- Check CORS settings in FastAPI
- Update API_BASE URL in frontend if using different port

**Build errors:**
\`\`\`bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
\`\`\`

## Environment Variables

### Backend (.env)
\`\`\`env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
PINECONE_INDEX_NAME=...
\`\`\`

### Frontend
No environment variables required for local development. The API base URL is hardcoded to `http://localhost:8000/api`.

For production, update the API_BASE constant in each page component.

## Development

### Adding New Subjects

1. Update Pinecone index with new subject documents
2. Add subject to dropdown options in frontend components
3. Update backend subject validation if needed

### Customizing Proctoring

Edit `proctoring.py` to adjust:
- Detection thresholds
- Recording duration
- Cheating vote requirements
- Exam duration

## License

MIT License - Feel free to use for educational purposes

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation at `http://localhost:8000/docs`
3. Check backend logs for error messages

## Credits

Built with:
- Next.js & React
- FastAPI
- OpenAI GPT
- Pinecone Vector Database
- YOLO v8
- MediaPipe
- shadcn/ui
