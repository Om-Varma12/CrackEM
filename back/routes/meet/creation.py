
from fastapi import APIRouter, Request
from back.db.meet import makeMeet

router = APIRouter(
    prefix="/meet",
    tags=["meets_creation"],
)

@router.get("/create")
async def create_meet(meetID: str, request: Request):
    session = request.cookies.get("session_id")    
    if not session:
        return {"error": "Not logged in"}   
    
    result = makeMeet(session, meetID)
    return result