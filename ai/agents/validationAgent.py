import os
import json
import httpx

from back.db.utils.messages import putMessage
from back.db.allMeetFunctions import getMeet, getQuestionAsked

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROMPT_PATH = os.path.join(BASE_DIR, "..", "prompts", "validationAgent.txt")

with open(PROMPT_PATH, "r", encoding="utf-8") as f:
    PROMPT_TEMPLATE = f.read()

async def validate(meetID, llm_response, userMessage):
    print(f"[FOLLOWUP] Function called", flush=True)
    meet = getMeet(meetID)
    question_number = getQuestionAsked(meet)
    
    if question_number < 2:
        print("\nValidating\n")
        print(llm_response)
        
        prompt = (
            PROMPT_TEMPLATE
            .replace("<question>", llm_response)
            .replace("<answer>", userMessage)
        )

        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3.1:8b",
                    "prompt": prompt,
                    "stream": False
                }
            )

        try:
            data = res.json()
            raw_text = data.get("response", "")
        except Exception:
            return {
                "status": "failed",
                "message": "Internal validation error. Please answer again."
            }

        # print("RAW VALIDATOR OUTPUT:", raw_text)

        # -------------------------------
        # Parse JSON returned by LLM
        # -------------------------------
        try:
            parsed = json.loads(raw_text)
        except Exception:
            return {
                "status": "failed",
                "message": "Internal validation error. Please answer again."
            }

        status = parsed.get("status")
        message = parsed.get("message")

        # if status not in ("success", "failed") or not isinstance(message, str):
        #     return {
        #         "status": "failed",
        #         "message": "Internal validation error. Please answer again."
        #     }

        print("\nValidation Done\n")
        print("Status:", status)
        print("Message:", message)
        
        return {
            "status": status,
            "message": message
        }
    else:
        return{
            'status': 'success',
            'message': 'Validation skipped for question number 2 or higher.'
        }