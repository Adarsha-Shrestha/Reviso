from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime

from api.models import ChatRequest, ChatResponse, ChatSession, ErrorResponse
from graph.utils.conversational_detector import detect_conversational_query
from graph.utils.conversational_responses import generate_conversational_response
from graph.state import GraphState
from graph.utils.source_extractor import format_sources_for_display

router = APIRouter()

# In-memory session storage (use Redis or database in production)
chat_sessions: Dict[str, ChatSession] = {}

def get_rag_app():
    from main import rag_app
    return rag_app

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest, rag_app=Depends(get_rag_app)):
    """
    Enhanced conversational message endpoint with better engagement
    """
    try:
        # Validate subject if provided
        valid_subjects = ["DataMining", "Network", "Distributed", "Energy"]
        if request.subject and request.subject not in valid_subjects:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid subject. Must be one of: {valid_subjects}"
            )

        # Enhanced query detection with intent analysis
        detection = detect_conversational_query(
            request.question,
            request.subject or "general topics"
        )
        
        print(f"Query Intent: {detection.get('query_intent')}")
        print(f"Is Conversational: {detection.get('is_conversational')}")
        print(f"Requires Context: {detection.get('requires_context')}")
        
        # Handle purely conversational queries (greetings, thanks, etc.)
        if detection["is_conversational"] and not detection["is_question"]:
            state = GraphState(
                question=request.question,
                subject=request.subject
            )
            result = generate_conversational_response(state)
            
            return ChatResponse(
                generation=result["generation"],
                sources=None,
                is_conversational=True,
                subject=request.subject
            )
        
        # Prepare input for RAG system with enhanced state
        input_data = {
            "question": request.question,
            "loop_count": 0,
            "is_conversational": False,
            "conversation_history": [],  # Can be populated from session
        }
        
        if request.subject:
            input_data["subject"] = request.subject
        
        # Invoke RAG system
        print(f"Invoking RAG system for: {request.question[:50]}...")
        result = rag_app.invoke(input=input_data)
        
        # Extract response data
        generation = result.get("generation", "I couldn't generate an answer. Could you rephrase your question?")
        sources = result.get("sources", [])
        is_conversational = result.get("is_conversational", False)
        answer_quality = result.get("answer_quality_score", "good")
        
        print(f"Answer quality: {answer_quality}")
        
        return ChatResponse(
            generation=generation,
            sources=sources,
            is_conversational=is_conversational,
            subject=request.subject
        )
        
    except Exception as e:
        print(f"Error in send_message: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing message: {str(e)}"
        )

@router.post("/session", response_model=Dict[str, str])
async def create_chat_session():
    """
    Create a new chat session with conversation tracking
    """
    session_id = str(uuid.uuid4())
    session = ChatSession(
        session_id=session_id,
        messages=[]
    )
    chat_sessions[session_id] = session
    
    return {
        "session_id": session_id,
        "message": "Chat session created successfully"
    }

@router.get("/session/{session_id}", response_model=ChatSession)
async def get_chat_session(session_id: str):
    """
    Get chat session by ID with full conversation history
    """
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    return chat_sessions[session_id]

@router.post("/session/{session_id}/message", response_model=ChatResponse)
async def send_session_message(
    session_id: str,
    request: ChatRequest,
    rag_app=Depends(get_rag_app)
):
    """
    Send a message within a specific chat session with context tracking
    """
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    session = chat_sessions[session_id]
    
    # Add user message to session
    session.messages.append({
        "role": "user",
        "content": request.question,
        "timestamp": datetime.now().isoformat(),
        "subject": request.subject
    })
    
    # Get response from RAG system
    response = await send_message(request, rag_app)
    
    # Add assistant message to session
    session.messages.append({
        "role": "assistant",
        "content": response.generation,
        "timestamp": datetime.now().isoformat(),
        "sources": response.sources,
        "is_conversational": response.is_conversational
    })
    
    return response

@router.delete("/session/{session_id}")
async def delete_chat_session(session_id: str):
    """
    Delete a chat session
    """
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    del chat_sessions[session_id]
    return {"message": "Chat session deleted successfully"}

@router.get("/sessions")
async def list_chat_sessions():
    """
    List all chat sessions with metadata
    """
    return {
        "sessions": [
            {
                "session_id": session_id,
                "message_count": len(session.messages),
                "created": session.messages[0]["timestamp"] if session.messages else None,
                "last_updated": session.messages[-1]["timestamp"] if session.messages else None
            }
            for session_id, session in chat_sessions.items()
        ],
        "total_sessions": len(chat_sessions)
    }

@router.get("/subjects")
async def get_available_subjects():
    """
    Get list of available subjects for filtering
    """
    return {
        "subjects": ["DataMining", "Network", "Distributed", "Energy"],
        "description": "Available subject filters for RAG queries"
    }

@router.post("/feedback")
async def submit_feedback(
    session_id: str,
    message_index: int,
    rating: int,
    comment: Optional[str] = None
):
    """
    Submit feedback on a specific message (for future improvements)
    """
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    session = chat_sessions[session_id]
    
    if message_index >= len(session.messages):
        raise HTTPException(status_code=400, detail="Invalid message index")
    
    # Store feedback (in production, save to database)
    feedback = {
        "session_id": session_id,
        "message_index": message_index,
        "rating": rating,
        "comment": comment,
        "timestamp": datetime.now().isoformat()
    }
    
    print(f"Feedback received: {feedback}")
    
    return {
        "success": True,
        "message": "Thank you for your feedback!"
    }