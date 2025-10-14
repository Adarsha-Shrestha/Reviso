from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

# Chat/RAG Models
class ChatRequest(BaseModel):
    question: str = Field(..., description="User question")
    subject: Optional[str] = Field(None, description="Subject filter (DataMining, Network, Distributed, Energy)")
    session_id: Optional[str] = Field(None, description="Session ID for conversation tracking")

class ChatResponse(BaseModel):
    generation: str = Field(..., description="Generated answer")
    sources: Optional[List[Dict[str, Any]]] = Field(None, description="Source documents with metadata")
    is_conversational: bool = Field(False, description="Whether response is conversational")
    subject: Optional[str] = Field(None, description="Applied subject filter")
    answer_quality: Optional[str] = Field(None, description="Quality indicator: excellent, good, needs_improvement")

class ChatSession(BaseModel):
    session_id: str
    messages: List[Dict[str, Any]]
    created_at: Optional[str] = None
    last_updated: Optional[str] = None
    subject_focus: Optional[str] = None

# Quiz Models
class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class QuizGenerateRequest(BaseModel):
    topic: str = Field(..., description="Topic for quiz generation")
    subject: Optional[str] = Field(None, description="Subject filter")
    num_questions: int = Field(5, ge=1, le=20, description="Number of questions")
    difficulty: Optional[DifficultyLevel] = Field(None, description="Difficulty level filter")

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str
    difficulty: str

class QuizGenerateResponse(BaseModel):
    success: bool
    message: str
    quiz_data: Optional[List[QuizQuestion]] = None
    subject: Optional[str] = None
    quiz_id: Optional[str] = None

class QuizAnswerRequest(BaseModel):
    quiz_id: str
    question_index: int
    answer: str  # A, B, C, or D

class QuizAnswerResponse(BaseModel):
    correct: bool
    correct_answer: str
    explanation: str
    score: Optional[int] = None
    total_questions: Optional[int] = None

class QuizResultsResponse(BaseModel):
    quiz_id: str
    score: int
    total_questions: int
    percentage: float
    feedback: str

# Flashcard Models
class FlashcardGenerateRequest(BaseModel):
    topic: str = Field(..., description="Topic for flashcard generation")
    subject: Optional[str] = Field(None, description="Subject filter")
    num_cards: int = Field(10, ge=1, le=50, description="Number of flashcards")

class Flashcard(BaseModel):
    front: str
    back: str
    category: str
    difficulty: str
    tags: List[str]

class FlashcardGenerateResponse(BaseModel):
    success: bool
    message: str
    flashcard_data: Optional[List[Flashcard]] = None
    subject: Optional[str] = None
    set_id: Optional[str] = None

class StudySessionRequest(BaseModel):
    set_id: str
    session_type: str = Field("review", description="Type of study session")

class StudySessionResponse(BaseModel):
    session_id: str
    flashcards: List[Flashcard]
    current_card: int
    total_cards: int

class FlashcardReviewRequest(BaseModel):
    session_id: str
    card_index: int
    difficulty_rating: int = Field(..., ge=1, le=5, description="1=very easy, 5=very hard")

# Feedback Models
class FeedbackRequest(BaseModel):
    session_id: str
    message_index: int
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 (poor) to 5 (excellent)")
    comment: Optional[str] = Field(None, description="Optional feedback comment")

class FeedbackResponse(BaseModel):
    success: bool
    message: str

# Common response models
class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None

class SuccessResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    
# Exam Models
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
    exam_id: Optional[str] = None
    exam_data: Optional[List[ExamQuestion]] = None
    topic: Optional[str] = None
    subject: Optional[str] = None
    total_marks: Optional[int] = None
    total_questions: Optional[int] = None

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
    subject: Optional[str] = None
    evaluations: List[QuestionEvaluation]
    total_score: float
    total_max_marks: int
    percentage: float
    overall_feedback: str
    questions_evaluated: int
    evaluated_at: str