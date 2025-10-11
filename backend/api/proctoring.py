from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

router = APIRouter()

# Global proctoring system instance (will be injected from main.py)
proctoring_system = None

def set_proctoring_system(system):
    """Set the global proctoring system instance"""
    global proctoring_system
    proctoring_system = system

# Pydantic Models
class StartProctoringRequest(BaseModel):
    username: str
    exam_duration: Optional[int] = 100  # Duration in seconds

class ProctoringStatusResponse(BaseModel):
    active: bool
    time_remaining: int

class UserDataResponse(BaseModel):
    username: str
    data: List[Tuple[float, bool]]
    total_cheating_instances: int
    total_duration: float

class ProctoringResponse(BaseModel):
    status: str
    message: str

class AltTabEvent(BaseModel):
    type: str
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    time_elapsed: Optional[float] = None

# API Endpoints

@router.post("/start", response_model=ProctoringResponse)
async def start_proctoring(request: StartProctoringRequest):
    """
    Start proctoring for a user
    
    Parameters:
    - username: The username of the student
    - exam_duration: Duration of exam in seconds (default: 100)
    """
    if proctoring_system is None:
        raise HTTPException(status_code=500, detail="Proctoring system not initialized")
    
    try:
        # Set exam duration if provided
        if request.exam_duration:
            proctoring_system.total_time = request.exam_duration
        
        proctoring_system.start_proctoring(request.username)
        
        return ProctoringResponse(
            status="active",
            message=f"Proctoring started for {request.username} (Duration: {request.exam_duration}s)"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting proctoring: {str(e)}")


@router.post("/stop", response_model=ProctoringResponse)
async def stop_proctoring():
    """
    Stop proctoring session
    """
    if proctoring_system is None:
        raise HTTPException(status_code=500, detail="Proctoring system not initialized")
    
    try:
        proctoring_system.stop_proctoring()
        return ProctoringResponse(
            status="inactive",
            message="Proctoring stopped successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error stopping proctoring: {str(e)}")


@router.get("/status", response_model=ProctoringStatusResponse)
async def get_proctoring_status():
    """
    Get current proctoring status and time remaining
    """
    if proctoring_system is None:
        raise HTTPException(status_code=500, detail="Proctoring system not initialized")
    
    try:
        status = proctoring_system.get_feed_status()
        return ProctoringStatusResponse(
            active=status["active"],
            time_remaining=status["time_remaining"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting status: {str(e)}")


@router.get("/video_feed/{username}")
async def video_feed(username: str):
    """
    Stream video feed with proctoring analysis overlays
    
    This endpoint returns a multipart stream that can be displayed in an HTML img tag:
    <img src="http://localhost:8000/api/proctoring/video_feed/username" />
    """
    if proctoring_system is None:
        raise HTTPException(status_code=500, detail="Proctoring system not initialized")
    
    if not proctoring_system.video_feed_active:
        raise HTTPException(
            status_code=400,
            detail="Video feed is not active. Please start proctoring first."
        )
    
    try:
        return StreamingResponse(
            proctoring_system.generate_video_feed(username),
            media_type="multipart/x-mixed-replace; boundary=frame"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error streaming video: {str(e)}")


@router.get("/user_data/{username}", response_model=UserDataResponse)
async def get_user_data(username: str):
    """
    Get cheating detection data for a specific user
    
    Returns:
    - List of tuples: (elapsed_time, is_cheating)
    - Total cheating instances
    - Total exam duration
    """
    if proctoring_system is None:
        raise HTTPException(status_code=500, detail="Proctoring system not initialized")
    
    try:
        data = proctoring_system.get_user_data(username)
        
        if not data:
            return UserDataResponse(
                username=username,
                data=[],
                total_cheating_instances=0,
                total_duration=0.0
            )
        
        # Calculate statistics
        cheating_count = sum(1 for _, is_cheating in data if is_cheating)
        total_duration = data[-1][0] if data else 0.0
        
        return UserDataResponse(
            username=username,
            data=data,
            total_cheating_instances=cheating_count,
            total_duration=total_duration
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting user data: {str(e)}")


@router.post("/toggle", response_model=ProctoringResponse)
async def toggle_proctoring():
    """
    Toggle proctoring on/off
    
    Note: To start proctoring, use the /start endpoint with a username
    """
    if proctoring_system is None:
        raise HTTPException(status_code=500, detail="Proctoring system not initialized")
    
    try:
        if proctoring_system.video_feed_active:
            proctoring_system.stop_proctoring()
            return ProctoringResponse(
                status="inactive",
                message="Proctoring stopped"
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Use /start endpoint with username to start proctoring"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error toggling proctoring: {str(e)}")


@router.post("/alt-tab")
async def handle_alt_tab(event: AltTabEvent):
    """
    Log Alt-Tab events (window switching detection)
    
    This endpoint can be called from frontend to track when user switches windows
    """
    try:
        # Convert timestamps to readable format if provided
        start_time = None
        end_time = None
        
        if event.start_time:
            start_time = datetime.fromtimestamp(event.start_time / 1000)
        if event.end_time:
            end_time = datetime.fromtimestamp(event.end_time / 1000)
        
        # Log the event
        log_message = f"Alt-Tab Event: Type={event.type}"
        if start_time:
            log_message += f", Start={start_time}"
        if end_time:
            log_message += f", End={end_time}"
        if event.time_elapsed:
            log_message += f", Elapsed={event.time_elapsed}s"
        
        print(log_message)
        
        return JSONResponse(
            content={
                "status": "success",
                "message": "Alt-Tab event logged",
                "data": {
                    "type": event.type,
                    "start_time": str(start_time) if start_time else None,
                    "end_time": str(end_time) if end_time else None,
                    "time_elapsed": event.time_elapsed
                }
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging alt-tab event: {str(e)}")


@router.get("/recordings")
async def list_recordings():
    """
    List all cheating recordings saved
    """
    if proctoring_system is None:
        raise HTTPException(status_code=500, detail="Proctoring system not initialized")
    
    try:
        import os
        recordings_dir = proctoring_system.RECORDING_DIR
        
        if not os.path.exists(recordings_dir):
            return JSONResponse(content={
                "recordings": [],
                "total": 0,
                "message": "No recordings directory found"
            })
        
        recordings = []
        for filename in os.listdir(recordings_dir):
            if filename.endswith('.mp4'):
                file_path = os.path.join(recordings_dir, filename)
                file_size = os.path.getsize(file_path)
                file_time = os.path.getmtime(file_path)
                
                recordings.append({
                    "filename": filename,
                    "size_mb": round(file_size / (1024 * 1024), 2),
                    "created_at": datetime.fromtimestamp(file_time).isoformat(),
                    "path": file_path
                })
        
        return JSONResponse(content={
            "recordings": recordings,
            "total": len(recordings),
            "directory": recordings_dir
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing recordings: {str(e)}")


@router.delete("/recordings/{filename}")
async def delete_recording(filename: str):
    """
    Delete a specific recording file
    """
    if proctoring_system is None:
        raise HTTPException(status_code=500, detail="Proctoring system not initialized")
    
    try:
        import os
        file_path = os.path.join(proctoring_system.RECORDING_DIR, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Recording not found")
        
        if not filename.endswith('.mp4'):
            raise HTTPException(status_code=400, detail="Invalid file format")
        
        os.remove(file_path)
        
        return JSONResponse(content={
            "status": "success",
            "message": f"Recording {filename} deleted successfully"
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting recording: {str(e)}")


@router.get("/settings")
async def get_settings():
    """
    Get current proctoring settings
    """
    if proctoring_system is None:
        raise HTTPException(status_code=500, detail="Proctoring system not initialized")
    
    return JSONResponse(content={
        "total_time": proctoring_system.total_time,
        "minimum_cheating_duration": proctoring_system.MINIMUM_CHEATING_DURATION,
        "recording_directory": proctoring_system.RECORDING_DIR,
        "audio_detection_active": proctoring_system.audio_detection_active,
        "video_feed_active": proctoring_system.video_feed_active
    })


@router.post("/settings")
async def update_settings(
    total_time: Optional[int] = None,
    minimum_cheating_duration: Optional[int] = None
):
    """
    Update proctoring settings
    
    Parameters:
    - total_time: Total exam duration in seconds
    - minimum_cheating_duration: Minimum duration to save cheating clips
    """
    if proctoring_system is None:
        raise HTTPException(status_code=500, detail="Proctoring system not initialized")
    
    updated = {}
    
    if total_time is not None:
        proctoring_system.total_time = total_time
        updated["total_time"] = total_time
    
    if minimum_cheating_duration is not None:
        proctoring_system.MINIMUM_CHEATING_DURATION = minimum_cheating_duration
        updated["minimum_cheating_duration"] = minimum_cheating_duration
    
    return JSONResponse(content={
        "status": "success",
        "message": "Settings updated",
        "updated": updated
    })


@router.get("/statistics/{username}")
async def get_user_statistics(username: str):
    """
    Get detailed statistics for a user's proctoring session
    """
    if proctoring_system is None:
        raise HTTPException(status_code=500, detail="Proctoring system not initialized")
    
    try:
        data = proctoring_system.get_user_data(username)
        
        if not data:
            return JSONResponse(content={
                "username": username,
                "message": "No data available for this user"
            })
        
        # Calculate statistics
        total_entries = len(data)
        cheating_instances = sum(1 for _, is_cheating in data if is_cheating)
        non_cheating_instances = total_entries - cheating_instances
        
        cheating_percentage = (cheating_instances / total_entries * 100) if total_entries > 0 else 0
        
        total_duration = data[-1][0] if data else 0.0
        
        return JSONResponse(content={
            "username": username,
            "total_entries": total_entries,
            "cheating_instances": cheating_instances,
            "non_cheating_instances": non_cheating_instances,
            "cheating_percentage": round(cheating_percentage, 2),
            "total_duration_seconds": round(total_duration, 2),
            "exam_completed": not proctoring_system.video_feed_active
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting statistics: {str(e)}")