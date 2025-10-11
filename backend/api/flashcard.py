from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
import uuid
import random
from datetime import datetime, timedelta

from api.models import (
    FlashcardGenerateRequest, FlashcardGenerateResponse, Flashcard,
    StudySessionRequest, StudySessionResponse, FlashcardReviewRequest
)
from app3 import FlashcardSystem

router = APIRouter()

# In-memory storage (use Redis or database in production)
flashcard_sets: Dict[str, Dict[str, Any]] = {}
study_sessions: Dict[str, Dict[str, Any]] = {}

def get_flashcard_system() -> FlashcardSystem:
    from main import flashcard_system
    if flashcard_system is None:
        raise HTTPException(status_code=500, detail="Flashcard system not initialized")
    return flashcard_system

@router.post("/generate", response_model=FlashcardGenerateResponse)
async def generate_flashcards(
    request: FlashcardGenerateRequest,
    flashcard_system: FlashcardSystem = Depends(get_flashcard_system)
):
    """
    Generate a new set of flashcards on a specific topic
    """
    try:
        # Validate subject if provided
        valid_subjects = ["DataMining", "Network", "Distributed"]
        if request.subject and request.subject not in valid_subjects:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid subject. Must be one of: {valid_subjects}"
            )
        
        # Generate flashcards using the flashcard system
        result = flashcard_system.generate_flashcards(
            topic=request.topic,
            subject=request.subject,
            num_cards=request.num_cards
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        # Create set ID and store flashcard data
        set_id = str(uuid.uuid4())
        flashcards = [Flashcard(**card) for card in result["flashcard_data"]]
        
        # Calculate difficulty distribution
        difficulty_counts = {}
        category_counts = {}
        for card in result["flashcard_data"]:
            diff = card.get("difficulty", "unknown")
            cat = card.get("category", "General")
            difficulty_counts[diff] = difficulty_counts.get(diff, 0) + 1
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        flashcard_sets[set_id] = {
            "set_id": set_id,
            "topic": request.topic,
            "subject": request.subject,
            "flashcards": result["flashcard_data"],
            "created_at": datetime.now().isoformat(),
            "total_cards": len(result["flashcard_data"]),
            "difficulty_distribution": difficulty_counts,
            "category_distribution": category_counts
        }
        
        return FlashcardGenerateResponse(
            success=True,
            message=result["message"],
            flashcard_data=flashcards,
            subject=request.subject,
            set_id=set_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating flashcards: {str(e)}")

@router.get("/sets")
async def list_flashcard_sets():
    """
    List all available flashcard sets
    """
    sets_list = []
    for set_id, set_data in flashcard_sets.items():
        sets_list.append({
            "set_id": set_id,
            "topic": set_data["topic"],
            "subject": set_data.get("subject"),
            "total_cards": set_data["total_cards"],
            "created_at": set_data["created_at"],
            "difficulty_distribution": set_data.get("difficulty_distribution", {}),
            "category_distribution": set_data.get("category_distribution", {})
        })
    
    return {"flashcard_sets": sets_list}

@router.get("/set/{set_id}")
async def get_flashcard_set(set_id: str):
    """
    Get flashcard set details by ID
    """
    if set_id not in flashcard_sets:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    
    set_data = flashcard_sets[set_id]
    flashcards = [Flashcard(**card) for card in set_data["flashcards"]]
    
    return {
        "set_id": set_id,
        "topic": set_data["topic"],
        "subject": set_data.get("subject"),
        "flashcards": flashcards,
        "total_cards": set_data["total_cards"],
        "created_at": set_data["created_at"],
        "difficulty_distribution": set_data.get("difficulty_distribution", {}),
        "category_distribution": set_data.get("category_distribution", {})
    }

@router.post("/study/start", response_model=StudySessionResponse)
async def start_study_session(request: StudySessionRequest):
    """
    Start a new study session with a flashcard set
    """
    if request.set_id not in flashcard_sets:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    
    set_data = flashcard_sets[request.set_id]
    session_id = str(uuid.uuid4())
    
    # Shuffle flashcards for better learning
    flashcards = set_data["flashcards"].copy()
    random.shuffle(flashcards)
    
    # Create study session
    study_sessions[session_id] = {
        "session_id": session_id,
        "set_id": request.set_id,
        "session_type": request.session_type,
        "flashcards": flashcards,
        "current_card": 0,
        "completed_cards": 0,
        "started_at": datetime.now().isoformat(),
        "reviews": [],
        "completed": False
    }
    
    flashcard_objects = [Flashcard(**card) for card in flashcards]
    
    return StudySessionResponse(
        session_id=session_id,
        flashcards=flashcard_objects,
        current_card=0,
        total_cards=len(flashcards)
    )

@router.get("/study/{session_id}/current")
async def get_current_card(session_id: str):
    """
    Get the current flashcard in the study session
    """
    if session_id not in study_sessions:
        raise HTTPException(status_code=404, detail="Study session not found")
    
    session = study_sessions[session_id]
    
    if session["completed"]:
        raise HTTPException(status_code=400, detail="Study session completed")
    
    current_index = session["current_card"]
    if current_index >= len(session["flashcards"]):
        raise HTTPException(status_code=400, detail="No more cards in session")
    
    current_flashcard = session["flashcards"][current_index]
    
    return {
        "session_id": session_id,
        "current_card": Flashcard(**current_flashcard),
        "card_number": current_index + 1,
        "total_cards": len(session["flashcards"]),
        "progress": (current_index / len(session["flashcards"])) * 100
    }

@router.post("/study/{session_id}/review")
async def review_flashcard(session_id: str, request: FlashcardReviewRequest):
    """
    Submit a review/difficulty rating for the current flashcard
    """
    if session_id not in study_sessions:
        raise HTTPException(status_code=404, detail="Study session not found")
    
    session = study_sessions[session_id]
    
    if session["completed"]:
        raise HTTPException(status_code=400, detail="Study session already completed")
    
    current_index = session["current_card"]
    if current_index != request.card_index:
        raise HTTPException(status_code=400, detail="Card index mismatch")
    
    if current_index >= len(session["flashcards"]):
        raise HTTPException(status_code=400, detail="No more cards in session")
    
    # Record the review
    review = {
        "card_index": request.card_index,
        "difficulty_rating": request.difficulty_rating,
        "timestamp": datetime.now().isoformat(),
        "card": session["flashcards"][current_index]
    }
    
    session["reviews"].append(review)
    session["completed_cards"] += 1
    session["current_card"] += 1
    
    # Check if session is completed
    if session["current_card"] >= len(session["flashcards"]):
        session["completed"] = True
        session["completed_at"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "message": "Review recorded",
        "completed_cards": session["completed_cards"],
        "total_cards": len(session["flashcards"]),
        "session_completed": session["completed"]
    }

@router.get("/study/{session_id}/progress")
async def get_study_progress(session_id: str):
    """
    Get progress information for a study session
    """
    if session_id not in study_sessions:
        raise HTTPException(status_code=404, detail="Study session not found")
    
    session = study_sessions[session_id]
    total_cards = len(session["flashcards"])
    completed_cards = session["completed_cards"]
    progress_percentage = (completed_cards / total_cards * 100) if total_cards > 0 else 0
    
    # Calculate difficulty distribution from reviews
    difficulty_stats = {}
    if session["reviews"]:
        for review in session["reviews"]:
            rating = review["difficulty_rating"]
            difficulty_stats[rating] = difficulty_stats.get(rating, 0) + 1
    
    return {
        "session_id": session_id,
        "total_cards": total_cards,
        "completed_cards": completed_cards,
        "remaining_cards": total_cards - completed_cards,
        "progress_percentage": round(progress_percentage, 2),
        "session_completed": session["completed"],
        "difficulty_ratings": difficulty_stats,
        "started_at": session["started_at"],
        "completed_at": session.get("completed_at")
    }

@router.get("/study/{session_id}/results")
async def get_study_results(session_id: str):
    """
    Get final results and statistics for a completed study session
    """
    if session_id not in study_sessions:
        raise HTTPException(status_code=404, detail="Study session not found")
    
    session = study_sessions[session_id]
    
    if not session["completed"]:
        raise HTTPException(status_code=400, detail="Study session not completed yet")
    
    reviews = session["reviews"]
    total_cards = len(session["flashcards"])
    
    # Calculate statistics
    difficulty_distribution = {}
    category_performance = {}
    average_difficulty = 0
    
    if reviews:
        # Difficulty distribution
        for review in reviews:
            rating = review["difficulty_rating"]
            difficulty_distribution[rating] = difficulty_distribution.get(rating, 0) + 1
        
        # Average difficulty
        total_rating = sum(review["difficulty_rating"] for review in reviews)
        average_difficulty = total_rating / len(reviews)
        
        # Category performance
        for review in reviews:
            card = review["card"]
            category = card.get("category", "General")
            if category not in category_performance:
                category_performance[category] = {
                    "total_cards": 0,
                    "average_difficulty": 0,
                    "total_rating": 0
                }
            category_performance[category]["total_cards"] += 1
            category_performance[category]["total_rating"] += review["difficulty_rating"]
        
        # Calculate average difficulty per category
        for category in category_performance:
            cat_data = category_performance[category]
            cat_data["average_difficulty"] = cat_data["total_rating"] / cat_data["total_cards"]
    
    # Generate study recommendations
    recommendations = []
    if average_difficulty >= 4:
        recommendations.append("Consider reviewing these cards again soon - they seem challenging")
    elif average_difficulty <= 2:
        recommendations.append("Great job! These concepts seem well understood")
    else:
        recommendations.append("Good progress! Consider spaced repetition for better retention")
    
    # Calculate session duration
    started_at = datetime.fromisoformat(session["started_at"])
    completed_at = datetime.fromisoformat(session["completed_at"])
    duration_minutes = (completed_at - started_at).total_seconds() / 60
    
    return {
        "session_id": session_id,
        "total_cards_studied": total_cards,
        "average_difficulty_rating": round(average_difficulty, 2),
        "difficulty_distribution": difficulty_distribution,
        "category_performance": category_performance,
        "session_duration_minutes": round(duration_minutes, 2),
        "recommendations": recommendations,
        "started_at": session["started_at"],
        "completed_at": session["completed_at"]
    }

@router.delete("/set/{set_id}")
async def delete_flashcard_set(set_id: str):
    """
    Delete a flashcard set
    """
    if set_id not in flashcard_sets:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    
    # Delete associated study sessions
    sessions_to_delete = [
        session_id for session_id, session in study_sessions.items()
        if session["set_id"] == set_id
    ]
    
    for session_id in sessions_to_delete:
        del study_sessions[session_id]
    
    del flashcard_sets[set_id]
    
    return {"message": "Flashcard set deleted successfully"}

@router.delete("/study/{session_id}")
async def delete_study_session(session_id: str):
    """
    Delete a study session
    """
    if session_id not in study_sessions:
        raise HTTPException(status_code=404, detail="Study session not found")
    
    del study_sessions[session_id]
    
    return {"message": "Study session deleted successfully"}

@router.get("/subjects/available")
async def get_available_flashcard_subjects():
    """
    Get available subjects for flashcard generation
    """
    return {
        "subjects": ["DataMining", "Network", "Distributed"],
        "description": "Available subjects for flashcard generation"
    }

@router.get("/study/sessions")
async def list_study_sessions():
    """
    List all study sessions
    """
    sessions_list = []
    for session_id, session_data in study_sessions.items():
        sessions_list.append({
            "session_id": session_id,
            "set_id": session_data["set_id"],
            "session_type": session_data["session_type"],
            "started_at": session_data["started_at"],
            "completed": session_data["completed"],
            "completed_cards": session_data["completed_cards"],
            "total_cards": len(session_data["flashcards"]),
            "progress_percentage": (session_data["completed_cards"] / len(session_data["flashcards"]) * 100) if len(session_data["flashcards"]) > 0 else 0
        })
    
    return {"study_sessions": sessions_list}