from pymongo import MongoClient
from datetime import datetime

client = MongoClient('mongodb://localhost:27017/')
db = client['CrackEM']
messages = db["messages"]

def getMeetMessages(meetID: str):
    # Find all messages for this meetID
    cursor = messages.find(
        {"meet_id": meetID}
    ).sort("timestamp", 1)  # sort by time if you have timestamp field

    result_lines = []

    for msg in cursor:
        sender = msg.get("sender", "unknown")
        text = msg.get("message", "")

        # normalize sender name
        sender = sender.lower()

        result_lines.append(text)

    # Join everything into one big string
    return "\n".join(result_lines)

# print(getNoOfAskedQs("pro3j789xhenpyh4oodzhl"))