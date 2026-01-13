from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)
db = client['CrackEM']
meets = db["meets"]

def getTopics(meetID: str, topic_category):
    topics = meets.find_one({
        "meet_id": meetID,
    })
    
    return topics[topic_category]

# print(getTopics("l6f427tb1b9tzruonjpjd", "candidate_questions"))