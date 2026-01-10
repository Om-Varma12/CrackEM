from pymongo import MongoClient
from datetime import datetime

client = MongoClient('mongodb://localhost:27017/')
db = client['CrackEM']
meets = db["meets"]

def incrementAskedQs(meetID: str):
    meets.update_one(
        {"meet_id": meetID},      
        {"$inc": {"questionAsked": 1}} 
    )
    
# print(incrementAskedQs("pro3j789xhenpyh4oodzhl"))