import os
import json
import requests

from back.db.utils.getMessages import getMeetMessages
from back.db.utils.messages import putMessage


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROMPT_PATH = os.path.join(BASE_DIR, "..", "prompts", "starterAgent.txt")


with open(PROMPT_PATH, "r", encoding="utf-8") as f:
    PROMPT_TEMPLATE = f.read()

def invokeStarterAgent(meetID):
    context = getMeetMessages(meetID)
    
    if not context or not context.strip():
        context = "No previous conversation."
    
    prompt = PROMPT_TEMPLATE.replace("<<MEET_HISTORY_FROM_DATABASE>>", context)
    
    res = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.1:8b",
            "prompt": prompt,
            "stream": True
        },
        stream=True,
        timeout=120
    )

    final_text = ""

    for line in res.iter_lines():
        if line:
            data = json.loads(line.decode("utf-8"))
            if "response" in data:
                final_text += data["response"]

    putMessage(meetID, "Jarvis", final_text)

    print(final_text)
    return final_text

# print(invokeStarterAgent("pro3j789xhenpyh4oodzhl"))