from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client['CrackEM']
sessions = db["sessions"]
users = db["users"]


def getNameForWelcome(session_id: str):
    if not session_id:
        return "Candidate"
        
    session = sessions.find_one({"session_id": session_id})
    if not session:
        return "Candidate"
        
    user_id = session.get("user_id")
    if not user_id:
        return "Candidate"
        
    user = users.find_one({"_id": user_id})
    if not user:
        return "Candidate"
        
    return user.get("name", "Candidate")