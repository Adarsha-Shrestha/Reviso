from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import uuid
from datetime import datetime

from api.models import (
    QuizGenerateRequest, QuizGenerateResponse, QuizQuestion,
    QuizAnswerRequest, QuizAnswerResponse, QuizResultsResponse
)
from app2 import QuizSystem

router = APIRouter()

# In-memory quiz storage (use Redis or database in production)
active_quizzes: Dict[str, Dict[str, Any]] = {}
quiz_sessions: Dict[str, Dict[str, Any]] = {}

def get_quiz_system() -> QuizSystem:
    from main import quiz_system
    if quiz_system is None:
        raise HTTPException(status_code=500, detail="Quiz system not initialized")
    return quiz_system

@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(
    request: QuizGenerateRequest, 
    quiz_system: QuizSystem = Depends(get_quiz_system)
):
    """
    Generate a new quiz on a specific topic
    """
    try:
        # Validate subject if provided
        valid_subjects = ["DataMining", "Network", "Distributed"]
        if request.subject and request.subject not in valid_subjects:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid subject. Must be one of: {valid_subjects}"
            )
        
        # Generate quiz using the quiz system
        result = quiz_system.generate_quiz(
            topic=request.topic,
            subject=request.subject,
            num_questions=request.num_questions
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        # Create quiz ID and store quiz data
        quiz_id = str(uuid.uuid4())
        quiz_questions = [
            QuizQuestion(**question) for question in result["quiz_data"]
        ]
        
        active_quizzes[quiz_id] = {
            "quiz_id": quiz_id,
            "topic": request.topic,
            "subject": request.subject,
            "questions": result["quiz_data"],
            "created_at": datetime.now().isoformat(),
            "total_questions": len(result["quiz_data"])
        }
        
        return QuizGenerateResponse(
            success=True,
            message=result["message"],
            quiz_data=quiz_questions,
            subject=request.subject,
            quiz_id=quiz_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")

@router.get("/list")
async def list_available_quizzes():
    """
    List all available quizzes
    """
    quiz_list = []
    for quiz_id, quiz_data in active_quizzes.items():
        quiz_list.append({
            "quiz_id": quiz_id,
            "topic": quiz_data["topic"],
            "subject": quiz_data.get("subject"),
            "total_questions": quiz_data["total_questions"],
            "created_at": quiz_data["created_at"]
        })
    
    return {"quizzes": quiz_list}

@router.get("/{quiz_id}")
async def get_quiz(quiz_id: str):
    """
    Get quiz details by ID
    """
    if quiz_id not in active_quizzes:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    quiz_data = active_quizzes[quiz_id]
    questions = [QuizQuestion(**q) for q in quiz_data["questions"]]
    
    return {
        "quiz_id": quiz_id,
        "topic": quiz_data["topic"],
        "subject": quiz_data.get("subject"),
        "questions": questions,
        "total_questions": quiz_data["total_questions"],
        "created_at": quiz_data["created_at"]
    }

@router.post("/session/{quiz_id}/start")
async def start_quiz_session(quiz_id: str):
    """
    Start a new quiz session
    """
    if quiz_id not in active_quizzes:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    session_id = str(uuid.uuid4())
    quiz_sessions[session_id] = {
        "session_id": session_id,
        "quiz_id": quiz_id,
        "current_question": 0,
        "score": 0,
        "answers": [],
        "started_at": datetime.now().isoformat(),
        "completed": False
    }
    
    quiz_data = active_quizzes[quiz_id]
    first_question = quiz_data["questions"][0] if quiz_data["questions"] else None
    
    return {
        "session_id": session_id,
        "quiz_id": quiz_id,
        "total_questions": quiz_data["total_questions"],
        "current_question": first_question,
        "question_number": 1
    }

@router.post("/session/{session_id}/answer", response_model=QuizAnswerResponse)
async def submit_answer(session_id: str, request: QuizAnswerRequest):
    """
    Submit an answer for the current question
    """
    if session_id not in quiz_sessions:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    session = quiz_sessions[session_id]
    if session["completed"]:
        raise HTTPException(status_code=400, detail="Quiz already completed")
    
    quiz_data = active_quizzes[session["quiz_id"]]
    questions = quiz_data["questions"]
    current_q_index = session["current_question"]
    
    if current_q_index >= len(questions):
        raise HTTPException(status_code=400, detail="No more questions")
    
    current_question = questions[current_q_index]
    correct_answer = current_question["correct_answer"].upper()
    user_answer = request.answer.upper()
    
    # Check if answer is correct
    is_correct = user_answer == correct_answer
    if is_correct:
        session["score"] += 1
    
    # Store answer
    session["answers"].append({
        "question_index": current_q_index,
        "user_answer": user_answer,
        "correct_answer": correct_answer,
        "is_correct": is_correct,
        "timestamp": datetime.now().isoformat()
    })
    
    # Move to next question
    session["current_question"] += 1
    
    # Check if quiz is completed
    if session["current_question"] >= len(questions):
        session["completed"] = True
        session["completed_at"] = datetime.now().isoformat()
    
    return QuizAnswerResponse(
        correct=is_correct,
        correct_answer=correct_answer,
        explanation=current_question.get("explanation", ""),
        score=session["score"],
        total_questions=len(questions)
    )

@router.get("/session/{session_id}/next")
async def get_next_question(session_id: str):
    """
    Get the next question in the quiz session
    """
    if session_id not in quiz_sessions:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    session = quiz_sessions[session_id]
    if session["completed"]:
        raise HTTPException(status_code=400, detail="Quiz completed")
    
    quiz_data = active_quizzes[session["quiz_id"]]
    questions = quiz_data["questions"]
    current_q_index = session["current_question"]
    
    if current_q_index >= len(questions):
        raise HTTPException(status_code=400, detail="No more questions")
    
    current_question = questions[current_q_index]
    
    return {
        "question": current_question,
        "question_number": current_q_index + 1,
        "total_questions": len(questions),
        "session_id": session_id
    }

@router.get("/session/{session_id}/results", response_model=QuizResultsResponse)
async def get_quiz_results(session_id: str):
    """
    Get final quiz results
    """
    if session_id not in quiz_sessions:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    session = quiz_sessions[session_id]
    if not session["completed"]:
        raise HTTPException(status_code=400, detail="Quiz not completed yet")
    
    quiz_data = active_quizzes[session["quiz_id"]]
    score = session["score"]
    total_questions = len(quiz_data["questions"])
    percentage = (score / total_questions) * 100 if total_questions > 0 else 0
    
    # Generate feedback based on percentage
    if percentage >= 90:
        feedback = "Excellent! Outstanding knowledge!"
    elif percentage >= 80:
        feedback = "Great job! Very good understanding!"
    elif percentage >= 70:
        feedback = "Good work! You're getting there!"
    elif percentage >= 60:
        feedback = "Not bad, but more study needed!"
    else:
        feedback = "Keep studying! You'll improve!"
    
    return QuizResultsResponse(
        quiz_id=session["quiz_id"],
        score=score,
        total_questions=total_questions,
        percentage=percentage,
        feedback=feedback
    )

@router.delete("/{quiz_id}")
async def delete_quiz(quiz_id: str):
    """
    Delete a quiz
    """
    if quiz_id not in active_quizzes:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Also delete any associated sessions
    sessions_to_delete = [
        session_id for session_id, session in quiz_sessions.items()
        if session["quiz_id"] == quiz_id
    ]
    
    for session_id in sessions_to_delete:
        del quiz_sessions[session_id]
    
    del active_quizzes[quiz_id]
    
    return {"message": "Quiz deleted successfully"}

@router.get("/subjects/available")
async def get_available_quiz_subjects():
    """
    Get available subjects for quiz generation
    """
    return {
        "subjects": ["DataMining", "Network", "Distributed"],
        "description": "Available subjects for quiz generation"
    }