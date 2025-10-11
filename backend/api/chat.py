from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
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
    Send a message to the RAG system and get a response
    """
    try:
        # Validate subject if provided
        valid_subjects = ["DataMining", "Network", "Distributed"]
        if request.subject and request.subject not in valid_subjects:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid subject. Must be one of: {valid_subjects}"
            )

        # Detect if query is conversational
        detection = detect_conversational_query(request.question, request.subject)
        
        # Handle conversational queries directly
        if detection["is_conversational"]:
            state = GraphState(question=request.question)
            result = generate_conversational_response(state)
            
            return ChatResponse(
                generation=result["generation"],
                sources=None,
                is_conversational=True,
                subject=request.subject
            )
        
        # Prepare input for RAG system
        input_data = {
            "question": request.question,
            "loop_count": 0,
            "is_conversational": False,
        }
        
        if request.subject:
            input_data["subject"] = request.subject
        
        # Invoke RAG system
        result = rag_app.invoke(input=input_data)
        
        # Extract response data
        generation = result.get("generation", "No answer generated")
        sources = result.get("sources", [])
        is_conversational = result.get("is_conversational", False)
        
        return ChatResponse(
            generation=generation,
            sources=sources,
            is_conversational=is_conversational,
            subject=request.subject
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

@router.post("/session", response_model=Dict[str, str])
async def create_chat_session():
    """
    Create a new chat session
    """
    session_id = str(uuid.uuid4())
    session = ChatSession(
        session_id=session_id,
        messages=[]
    )
    chat_sessions[session_id] = session
    
    return {"session_id": session_id, "message": "Chat session created"}

@router.get("/session/{session_id}", response_model=ChatSession)
async def get_chat_session(session_id: str):
    """
    Get chat session by ID
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
    Send a message within a specific chat session
    """
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    session = chat_sessions[session_id]
    
    # Add user message to session
    session.messages.append({
        "role": "user",
        "content": request.question,
        "timestamp": datetime.now().isoformat()
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
    return {"message": "Chat session deleted"}

@router.get("/sessions")
async def list_chat_sessions():
    """
    List all chat sessions
    """
    return {
        "sessions": [
            {
                "session_id": session_id,
                "message_count": len(session.messages),
                "created": session.messages[0]["timestamp"] if session.messages else None
            }
            for session_id, session in chat_sessions.items()
        ]
    }

@router.get("/subjects")
async def get_available_subjects():
    """
    Get list of available subjects for filtering
    """
    return {
        "subjects": ["DataMining", "Network"],
        "description": "Available subject filters for RAG queries"
    }