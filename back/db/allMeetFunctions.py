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


# ---------- Core Fetch ----------

def getMeet(meetID: str):
    meet = meets.find_one({"meet_id": meetID})
    if not meet:
        raise Exception(f"❌ Meet not found: {meetID}")
    return meet


# ---------- Read Helpers (NO DB CALLS) ----------

def getQuestionAsked(meet: dict) -> int:
    return meet["question_asked"]

def getTopics(meet: dict | str, topic_category: str):
    """Return the topics list for the given category.
    Accepts either a meet dict (as returned by `getMeet`) or a meetID string.
    """
    # If caller passed a meetID string, fetch the meet document
    if isinstance(meet, str):
        meet = getMeet(meet)

    if topic_category not in meet:
        raise KeyError(f"Topic category not found in meet: {topic_category}")

    return meet[topic_category]


# ---------- Write Helpers (DO DB WRITES) ----------

def removeTopic(meetID: str, topic_category: str, topic: str):
    meets.update_one(
        {"meet_id": meetID},
        {"$pull": {topic_category: topic}}
    )

def incrementAskedQs(meetID: str):
    meets.update_one(
        {"meet_id": meetID},
        {"$inc": {"question_asked": 1}}
    )
