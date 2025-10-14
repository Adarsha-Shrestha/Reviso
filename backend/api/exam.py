from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, Any, List
import uuid
from datetime import datetime
import asyncio

from api.models import ErrorResponse
from pydantic import BaseModel, Field
from exam import ExamSystem

router = APIRouter()

# In-memory exam storage (use Redis or database in production)
active_exams: Dict[str, Dict[str, Any]] = {}
exam_sessions: Dict[str, Dict[str, Any]] = {}
evaluation_results: Dict[str, Dict[str, Any]] = {}

# Pydantic Models for Exam API
class ExamGenerateRequest(BaseModel):
    topic: str = Field(..., description="Topic for exam generation")
    subject: str = Field(..., description="Subject filter (required)")
    num_hard: int = Field(3, ge=1, le=5, description="Number of hard questions (10 marks each)")
    num_medium: int = Field(9, ge=1, le=15, description="Number of medium questions (5 marks each)")

class ExamQuestion(BaseModel):
    question_number: int
    question: str
    question_type: str
    difficulty: str
    marks: int

class ExamGenerateResponse(BaseModel):
    success: bool
    message: str
    exam_id: str = None
    exam_data: List[ExamQuestion] = None
    topic: str = None
    subject: str = None
    total_marks: int = None
    total_questions: int = None

class ExamSessionResponse(BaseModel):
    session_id: str
    exam_id: str
    topic: str
    subject: str
    total_questions: int
    total_marks: int
    started_at: str

class AnswerSubmission(BaseModel):
    question_number: int = Field(..., description="Question number being answered")
    answer: str = Field(..., description="Student's answer to the question")

class ExamSubmissionRequest(BaseModel):
    session_id: str = Field(..., description="Exam session ID")
    answers: List[AnswerSubmission] = Field(..., description="List of answers")

class QuestionEvaluation(BaseModel):
    question_number: int
    score: float
    max_marks: int
    feedback: str
    strengths: List[str]
    improvements: List[str]
    key_points_covered: List[str]
    key_points_missed: List[str]

class ExamEvaluationResponse(BaseModel):
    success: bool
    exam_id: str
    session_id: str
    topic: str
    subject: str
    evaluations: List[QuestionEvaluation]
    total_score: float
    total_max_marks: int
    percentage: float
    overall_feedback: str
    questions_evaluated: int
    evaluated_at: str

# Dependency
def get_exam_system() -> ExamSystem:
    from main import exam_system
    if exam_system is None:
        raise HTTPException(status_code=500, detail="Exam system not initialized")
    return exam_system

@router.post("/generate", response_model=ExamGenerateResponse)
async def generate_exam(
    request: ExamGenerateRequest,
    exam_system: ExamSystem = Depends(get_exam_system)
):
    """
    Generate a new exam with specified number of questions
    
    - **3 HARD questions** (10 marks each) by default
    - **9 MEDIUM questions** (5 marks each) by default
    - Total: 12 questions, 75 marks
    """
    try:
        # Validate subject
        valid_subjects = ["DataMining", "Network", "Distributed", "Energy"]
        if request.subject not in valid_subjects:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid subject. Must be one of: {valid_subjects}"
            )
        
        # Generate exam
        result = exam_system.generate_exam(
            topic=request.topic,
            subject=request.subject,
            num_hard=request.num_hard,
            num_medium=request.num_medium
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        # Create exam ID and store exam data
        exam_id = str(uuid.uuid4())
        
        # Store only non-sensitive data (no sample answers or key points)
        exam_questions_public = [
            ExamQuestion(
                question_number=q["question_number"],
                question=q["question"],
                question_type=q["question_type"],
                difficulty=q["difficulty"],
                marks=q["marks"]
            )
            for q in result["exam_data"]
        ]
        
        # Store full data internally for evaluation
        active_exams[exam_id] = {
            "exam_id": exam_id,
            "topic": request.topic,
            "subject": request.subject,
            "questions_full": result["exam_data"],  # Full data with answers
            "questions_public": [q.dict() for q in exam_questions_public],  # Public data
            "created_at": datetime.now().isoformat(),
            "total_questions": len(result["exam_data"]),
            "total_marks": result["total_marks"]
        }
        
        return ExamGenerateResponse(
            success=True,
            message=result["message"],
            exam_id=exam_id,
            exam_data=exam_questions_public,
            topic=request.topic,
            subject=request.subject,
            total_marks=result["total_marks"],
            total_questions=len(result["exam_data"])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating exam: {str(e)}")

@router.get("/list")
async def list_available_exams():
    """
    List all available exams
    """
    exam_list = []
    for exam_id, exam_data in active_exams.items():
        exam_list.append({
            "exam_id": exam_id,
            "topic": exam_data["topic"],
            "subject": exam_data["subject"],
            "total_questions": exam_data["total_questions"],
            "total_marks": exam_data["total_marks"],
            "created_at": exam_data["created_at"]
        })
    
    return {"exams": exam_list}

@router.get("/{exam_id}")
async def get_exam(exam_id: str):
    """
    Get exam details by ID (returns questions without answers)
    """
    if exam_id not in active_exams:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    exam_data = active_exams[exam_id]
    
    return {
        "exam_id": exam_id,
        "topic": exam_data["topic"],
        "subject": exam_data["subject"],
        "questions": exam_data["questions_public"],
        "total_questions": exam_data["total_questions"],
        "total_marks": exam_data["total_marks"],
        "created_at": exam_data["created_at"]
    }

@router.post("/session/{exam_id}/start", response_model=ExamSessionResponse)
async def start_exam_session(exam_id: str):
    """
    Start a new exam session for a student
    """
    if exam_id not in active_exams:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    exam_data = active_exams[exam_id]
    session_id = str(uuid.uuid4())
    
    exam_sessions[session_id] = {
        "session_id": session_id,
        "exam_id": exam_id,
        "started_at": datetime.now().isoformat(),
        "submitted": False,
        "answers": []
    }
    
    return ExamSessionResponse(
        session_id=session_id,
        exam_id=exam_id,
        topic=exam_data["topic"],
        subject=exam_data["subject"],
        total_questions=exam_data["total_questions"],
        total_marks=exam_data["total_marks"],
        started_at=exam_sessions[session_id]["started_at"]
    )

@router.post("/evaluate", response_model=ExamEvaluationResponse)
async def evaluate_exam_submission(
    request: ExamSubmissionRequest,
    exam_system: ExamSystem = Depends(get_exam_system)
):
    """
    Evaluate exam submission asynchronously
    
    - Accepts session_id and list of answers
    - Evaluates all answers concurrently using async processing
    - Returns detailed evaluation with scores and feedback
    """
    try:
        # Validate session
        if request.session_id not in exam_sessions:
            raise HTTPException(status_code=404, detail="Exam session not found")
        
        session = exam_sessions[request.session_id]
        
        if session["submitted"]:
            raise HTTPException(status_code=400, detail="Exam already submitted")
        
        exam_id = session["exam_id"]
        
        if exam_id not in active_exams:
            raise HTTPException(status_code=404, detail="Exam not found")
        
        exam_data = active_exams[exam_id]
        
        # Validate all questions are answered
        expected_questions = set(range(1, exam_data["total_questions"] + 1))
        answered_questions = set(a.question_number for a in request.answers)
        
        if answered_questions != expected_questions:
            missing = expected_questions - answered_questions
            raise HTTPException(
                status_code=400,
                detail=f"Missing answers for questions: {sorted(missing)}"
            )
        
        # Prepare answers for evaluation
        answers_for_eval = [
            {
                "question_number": a.question_number,
                "answer": a.answer
            }
            for a in request.answers
        ]
        
        # Load exam data into exam system
        exam_system.current_exam = {
            "exam_data": exam_data["questions_full"],
            "topic": exam_data["topic"],
            "subject": exam_data["subject"],
            "total_marks": exam_data["total_marks"]
        }
        
        # Evaluate asynchronously
        print(f"---STARTING ASYNC EVALUATION FOR SESSION {request.session_id}---")
        evaluation_result = await exam_system.evaluate_exam_async(exam_id, answers_for_eval)
        
        if not evaluation_result["success"]:
            raise HTTPException(status_code=500, detail="Evaluation failed")
        
        # Mark session as submitted
        session["submitted"] = True
        session["submitted_at"] = datetime.now().isoformat()
        session["answers"] = [a.dict() for a in request.answers]
        
        # Store evaluation results
        eval_id = str(uuid.uuid4())
        evaluation_results[eval_id] = {
            **evaluation_result,
            "session_id": request.session_id,
            "evaluated_at": datetime.now().isoformat()
        }
        
        # Convert evaluations to response model
        evaluations = [
            QuestionEvaluation(**e) for e in evaluation_result["evaluations"]
            if e["success"]
        ]
        
        return ExamEvaluationResponse(
            success=True,
            exam_id=exam_id,
            session_id=request.session_id,
            topic=evaluation_result["topic"],
            subject=evaluation_result["subject"],
            evaluations=evaluations,
            total_score=evaluation_result["total_score"],
            total_max_marks=evaluation_result["total_max_marks"],
            percentage=evaluation_result["percentage"],
            overall_feedback=evaluation_result["overall_feedback"],
            questions_evaluated=evaluation_result["questions_evaluated"],
            evaluated_at=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error evaluating exam: {str(e)}")

@router.get("/session/{session_id}/status")
async def get_session_status(session_id: str):
    """
    Get exam session status
    """
    if session_id not in exam_sessions:
        raise HTTPException(status_code=404, detail="Exam session not found")
    
    session = exam_sessions[session_id]
    exam_data = active_exams[session["exam_id"]]
    
    return {
        "session_id": session_id,
        "exam_id": session["exam_id"],
        "topic": exam_data["topic"],
        "subject": exam_data["subject"],
        "started_at": session["started_at"],
        "submitted": session["submitted"],
        "submitted_at": session.get("submitted_at"),
        "total_questions": exam_data["total_questions"],
        "answers_submitted": len(session.get("answers", []))
    }

@router.get("/evaluation/{session_id}")
async def get_evaluation_results(session_id: str):
    """
    Get evaluation results for a submitted exam session
    """
    # Find evaluation by session_id
    evaluation = None
    for eval_id, eval_data in evaluation_results.items():
        if eval_data.get("session_id") == session_id:
            evaluation = eval_data
            break
    
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found for this session")
    
    return evaluation

@router.delete("/{exam_id}")
async def delete_exam(exam_id: str):
    """
    Delete an exam and all associated sessions
    """
    if exam_id not in active_exams:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Delete associated sessions
    sessions_to_delete = [
        session_id for session_id, session in exam_sessions.items()
        if session["exam_id"] == exam_id
    ]
    
    for session_id in sessions_to_delete:
        del exam_sessions[session_id]
    
    # Delete associated evaluations
    evals_to_delete = [
        eval_id for eval_id, eval_data in evaluation_results.items()
        if exam_sessions.get(eval_data.get("session_id", ""), {}).get("exam_id") == exam_id
    ]
    
    for eval_id in evals_to_delete:
        del evaluation_results[eval_id]
    
    del active_exams[exam_id]
    
    return {"message": "Exam and associated data deleted successfully"}

@router.get("/subjects/available")
async def get_available_exam_subjects():
    """
    Get available subjects for exam generation
    """
    return {
        "subjects": ["DataMining", "Network", "Distributed", "Energy"],
        "description": "Available subjects for exam generation"
    }

@router.get("/statistics")
async def get_exam_statistics():
    """
    Get overall exam statistics
    """
    total_exams = len(active_exams)
    total_sessions = len(exam_sessions)
    submitted_sessions = sum(1 for s in exam_sessions.values() if s["submitted"])
    total_evaluations = len(evaluation_results)
    
    # Calculate average scores if evaluations exist
    avg_percentage = 0
    if evaluation_results:
        percentages = [e["percentage"] for e in evaluation_results.values()]
        avg_percentage = sum(percentages) / len(percentages)
    
    return {
        "total_exams_created": total_exams,
        "total_sessions": total_sessions,
        "submitted_sessions": submitted_sessions,
        "pending_sessions": total_sessions - submitted_sessions,
        "total_evaluations": total_evaluations,
        "average_percentage": round(avg_percentage, 2)
    }