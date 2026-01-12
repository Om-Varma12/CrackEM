from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)
db = client['CrackEM']
messages = db["messages"]

def getMeetMessages(meetID: str):
    cursor = messages.find(
        {"meet_id": meetID}
    ).sort("timestamp", 1)

    result_lines = []

    for msg in cursor:
        sender = msg.get("sender", "unknown")
        text = msg.get("message", "").strip()

        # normalize sender name
        sender = sender.lower()

        if sender == "jarvis":
            sender_label = "Jarvis"
        elif sender == "user":
            sender_label = "User"
        else:
            sender_label = sender.capitalize()

        result_lines.append(f"{sender_label}: {text}")

    print("done")
    return "\n".join(result_lines)

# print(getMeetMessages("pprdmw8ktoxeoktwe0ma"))