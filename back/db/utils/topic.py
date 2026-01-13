from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client['CrackEM']
meets = db["meets"]

def removeTopic(meetID: str, topic_category: str, topic: str):
    meets.update_one(
        {"meet_id": meetID},
        {
            "$pull": {f"{topic_category}": topic}
        }
    )
    print("done")
    
# print(removeTopic("l6f427tb1b9tzruonjpjd", "candidate_questions", "tech stack"))