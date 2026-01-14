from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import os


load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client['CrackEM']
messages = db['messages']

def putMessage(meetID: str, message: str, sender: str):
    messages.insert_one({
        "meet_id": meetID,
        "message": message,
        "sender": sender,
        "sentAt": datetime.utcnow()
    })