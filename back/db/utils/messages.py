from pymongo import MongoClient
from datetime import datetime

client = MongoClient('mongodb://localhost:27017/')
db = client['CrackEM']
messages = db['messages']

def putMessage(meetID: str, message: str, sender: str):
    messages.insert_one({
        "meet_id": meetID,
        "message": message,
        "sender": sender,
        "sentAt": datetime.utcnow()
    })
    