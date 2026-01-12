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
    return {
        "questions": meet["questions"],
        "firstHalfQ": meet["firstHalfQ"],
        "secondHalfQs": meet["secondHalfQ"],
        "questionAsked": meet["questionAsked"],
    }

# print(getNoOfAskedQs("pprdmw8ktoxeoktwe0ma"))