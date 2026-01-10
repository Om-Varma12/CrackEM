from pymongo import MongoClient
from datetime import datetime

client = MongoClient('mongodb://localhost:27017/')
db = client['CrackEM']
meets = db["meets"]

def getNoOfAskedQs(meetID: str):
    meet = meets.find_one({"meet_id": meetID})
    return {
        "questions": meet["questions"],
        "firstHalfQ": meet["firstHalfQ"],
        "secondHalfQs": meet["secondHalfQ"],
        "questionAsked": meet["questionAsked"],
    }

# print(getNoOfAskedQs("pro3j789xhenpyh4oodzhl"))