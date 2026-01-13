from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["CrackEM"]
meets = db["meets"]
sessions = db["sessions"]

def makeMeet(sessionID: str, meetID: str, total_questions: int, technical_topics: list, dsa_questions: list):
    session = sessions.find_one({"session_id": sessionID})

    if not session:
        return {
            "status": "error",
            "message": "User not found"
        }

    user_id = session["user_id"]

    meets.insert_one({
        "user_id": user_id,
        "meet_id": meetID,
        "questionAsked": 0,
        "candidate_questions": ['intro of candidate', 'strengths and weaknesses', 'tech stack', 'candidate preferences', 'interests'],
        "total_questions": total_questions+2,
        "technical_topics": technical_topics,
        "dsa_questions": dsa_questions,
        "createdAt": datetime.utcnow()
    })
    print("MONGO INSERTED ID:")

    return {
        "status": "success",
        "message": "Meet created successfully"
    }