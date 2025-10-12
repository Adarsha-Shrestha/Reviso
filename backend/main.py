from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Dict, Any
import os
from dotenv import load_dotenv

# load_dotenv()
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

# import config  # This loads environment variables

# Import your existing systems
from graph.graph import app as rag_app
from quiz import QuizSystem
from flashcard import FlashcardSystem
from proctoring import ProctoringSystem

# Import API routers
from api.chat import router as chat_router
from api.quiz import router as quiz_router
from api.flashcard import router as flashcard_router
from api.proctoring import router as proctoring_router, set_proctoring_system
from api.ingestion import router as ingestion_router
from api.models import *



# Global instances
quiz_system = None
flashcard_system = None
proctoring_system = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global quiz_system, flashcard_system
    print("Initializing systems...")
    
    try:
        quiz_system = QuizSystem()
        flashcard_system = FlashcardSystem()
        proctoring_system = ProctoringSystem()
        set_proctoring_system(proctoring_system)
        # rag_app = rag_graph  # Store the graph
        print("Systems initialized successfully")
    except Exception as e:
        print(f"Error initializing systems: {e}")
        raise
    
    yield
    
    # Shutdown
    print("Shutting down...")
    if proctoring_system and proctoring_system.video_feed_active:
        print("  Stopping proctoring system...")
        proctoring_system.stop_proctoring()
    print("✓ Shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Educational RAG API",
    description="Backend API for RAG Chat, Quiz Generation, and Flashcard System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get systems
def get_quiz_system() -> QuizSystem:
    if quiz_system is None:
        raise HTTPException(status_code=500, detail="Quiz system not initialized")
    return quiz_system

def get_flashcard_system() -> FlashcardSystem:
    if flashcard_system is None:
        raise HTTPException(status_code=500, detail="Flashcard system not initialized")
    return flashcard_system

def get_proctoring_system() -> ProctoringSystem:
    if proctoring_system is None:
        raise HTTPException(status_code=500, detail="Proctoring system not initialized")
    return proctoring_system

def get_rag_app():
    return rag_app

# Include routers
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(quiz_router, prefix="/api/quiz", tags=["quiz"])
app.include_router(flashcard_router, prefix="/api/flashcard", tags=["flashcard"])
app.include_router(proctoring_router, prefix="/api/proctoring", tags=["Proctoring"])
app.include_router(ingestion_router, prefix="/api/ingestion", tags=["Ingestion"])


@app.get("/")
async def root():
    return {"message": "Educational RAG API is running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "rag_system": "initialized",
        "quiz_system": "initialized" if quiz_system else "not initialized",
        "flashcard_system": "initialized" if flashcard_system else "not initialized"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)