from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client['CrackEM']
meets = db["meets"]

def incrementAskedQs(meetID: str):
    meets.update_one(
        {"meet_id": meetID},      
        {"$inc": {"question_asked": 1}} 
    )
    
# print(incrementAskedQs("pro3j789xhenpyh4oodzhl"))