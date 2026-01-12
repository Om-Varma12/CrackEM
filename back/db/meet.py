from pymongo import MongoClient
from datetime import datetime
from back.services.getNoOfQ import getQ
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["CrackEM"]
meets = db["meets"]
sessions = db["sessions"]

def makeMeet(sessionID: str, meetID: str):
    session = sessions.find_one({"session_id": sessionID})

    if not session:
        return {
            "status": "error",
            "message": "User not found"
        }

    Qs = getQ()

    user_id = session["user_id"]

    meets.insert_one({
        "user_id": user_id,
        "meet_id": meetID,
        "questions": Qs[0],
        "firstHalfQ": Qs[1],
        "secondHalfQ": Qs[0] - Qs[1],
        "questionAsked": 0,
        "createdAt": datetime.utcnow()
    })

    return {
        "status": "success",
        "message": "Meet created successfully"
    }