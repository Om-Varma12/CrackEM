from pymongo import MongoClient
from datetime import datetime

client = MongoClient('mongodb://localhost:27017/')
db = client['CrackEM']
sessions = db["sessions"]
users = db["users"]


def getNameForWelcome(session_id: str):
    user_id = sessions.find_one({"session_id": session_id})["user_id"]
    name = users.find_one({"_id": user_id})
    return name["name"]