import os
import json
import httpx

from back.db.allMeetFunctions import getMeet, getQuestionAsked

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROMPT_PATH = os.path.join(BASE_DIR, "..", "prompts", "followupAgent.txt")

with open(PROMPT_PATH, "r", encoding="utf-8") as f:
    PROMPT_TEMPLATE = f.read()

async def followUp(meetID, question: str, answer: str):
    meet = getMeet(meetID)
    question_number = getQuestionAsked(meet)
    
    if question_number > 2:
        print("\nChecking if follow-up is needed...\n")
        print("Question:", question)
        print("Answer:", answer)

        prompt = (
            PROMPT_TEMPLATE
            .replace("<question>", question)
            .replace("<answer>", answer)
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
            raw_text = (data.get("response") or "").strip()
        except Exception:
            return {
                "status": "failed",
                "message": "Internal follow-up check error. Please answer again."
            }

        # -------------------------------
        # Parse JSON returned by LLM
        # -------------------------------
        try:
            parsed = json.loads(raw_text)
        except Exception:
            print("RAW FOLLOWUP AGENT OUTPUT:", raw_text)
            return {
                "status": "failed",
                "message": "Internal follow-up check error. Please answer again."
            }

        status = parsed.get("status")
        message = parsed.get("message")

        if status not in ("followup_needed", "no_followup_needed") or not isinstance(message, str):
            print("INVALID FOLLOWUP AGENT JSON:", parsed)
            return {
                "status": "failed",
                "message": "Internal follow-up check error. Please answer again."
            }

        print("\nFollow-up Check Done\n")
        print("Status:", status)
        print("Message:", message)

        return {
            "status": status,
            "message": message
        }
    else:
        return{
            "status": "no_followup_needed",
            "message": "The answer is sufficient to proceed."
        }