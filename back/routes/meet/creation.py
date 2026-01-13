from ai.agents.initializerAgent import getTopicsForInterview
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
    
    print("CALLING getTopicsForInterview()")
    topics = getTopicsForInterview()
    print("TOPICS RECEIVED:", topics)

    total_questions = len(topics["technical_topics"]) + len(topics["dsa_questions"])
    
    result = makeMeet(session, meetID, total_questions, topics["technical_topics"], topics["dsa_questions"])
    
    print("\nmeet created\n")
    return result