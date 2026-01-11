import os
import json
import httpx

from back.db.utils.getMessages import getMeetMessages
from back.db.utils.messages import putMessage


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROMPT_PATH = os.path.join(BASE_DIR, "..", "prompts", "starterAgent.txt")


with open(PROMPT_PATH, "r", encoding="utf-8") as f:
    PROMPT_TEMPLATE = f.read()

async def invokeStarterAgent(meetID):
    context = getMeetMessages(meetID)
    
    if not context or not context.strip():
        context = "No previous conversation."
    
    # print(context)
    
    prompt = PROMPT_TEMPLATE.replace("<<MEET_HISTORY_FROM_DATABASE>>", context)
    
    final_text = ""
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1:8b",
                "prompt": prompt,
                "stream": True
            }
        ) as response:
            async for line in response.aiter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        if "response" in data:
                            chunk = data["response"]
                            final_text += chunk
                            yield chunk
                        if data.get("done", False):
                            pass
                    except json.JSONDecodeError:
                        pass

    putMessage(meetID, final_text, "Jarvis")
    print(final_text)
    # No return needed as it is a generator, usage will be consuming the yields

# print(invokeStarterAgent("pro3j789xhenpyh4oodzhl"))