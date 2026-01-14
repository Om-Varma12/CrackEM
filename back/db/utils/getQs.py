import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise Exception("❌ MONGO_URI not found in .env")

client = MongoClient(MONGO_URI)
db = client["CrackEM"]
meets = db["meets"]

def getNoOfAskedQs(meetID: str):
    meet = meets.find_one({"meet_id": meetID})
    # print("MEET FETCHED FROM DB:", meet)
    return {
        "question_asked": meet["question_asked"],
    }

# print(getNoOfAskedQs("pprdmw8ktoxeoktwe0ma"))