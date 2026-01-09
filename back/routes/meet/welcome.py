from fastapi import APIRouter, Request
from back.services.welcome import sayFirstMessage

router = APIRouter(
    prefix="/meet",
    tags=["meets_creation"],
)

@router.post("/welcome")
async def welcome_user(meetID: str, request: Request):
    session_id = request.cookies.get("session_id") 
    message = sayFirstMessage(session_id, meetID)
    
    return {
        "message": message
        }