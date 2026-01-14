import os
import json
import httpx

from back.db.allMeetFunctions import getMeet, getQuestionAsked
from back.db.utils.messages import putMessage

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROMPT_PATH = os.path.join(BASE_DIR, "..", "prompts", "followupAgent.txt")

with open(PROMPT_PATH, "r", encoding="utf-8") as f:
    PROMPT_TEMPLATE = f.read()

async def followUp(meetID, question: str, answer: str):
    print(f"[FOLLOWUP] Function called", flush=True)
    meet = getMeet(meetID)
    question_number = getQuestionAsked(meet)
    print(f"[FOLLOWUP] Question number: {question_number}", flush=True)
    
    if question_number > 2:
        print(f"\n[FOLLOWUP] Checking if follow-up is needed...\n", flush=True)
        print(f"[FOLLOWUP] Question: {question}", flush=True)
        print(f"[FOLLOWUP] Answer: {answer}", flush=True)

        prompt = (
            PROMPT_TEMPLATE
            .replace("<question>", question)
            .replace("<answer>", answer)
        )

        print(f"[FOLLOWUP] Sending request to Ollama...", flush=True)
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3.1:8b",
                    "prompt": prompt,
                    "stream": False
                }
            )
        print(f"[FOLLOWUP] Ollama response status: {res.status_code}", flush=True)

        try:
            data = res.json()
            raw_text = (data.get("response") or "").strip()
            print(f"[FOLLOWUP] Raw LLM response: {raw_text[:200]}", flush=True)
        except Exception as e:
            print(f"[FOLLOWUP] Failed to parse Ollama response: {e}", flush=True)
            return {
                "status": "failed",
                "message": "Internal follow-up check error. Please answer again."
            }

        try:
            parsed = json.loads(raw_text)
            print(f"[FOLLOWUP] Parsed JSON: {parsed}", flush=True)
        except Exception as e:
            print(f"[FOLLOWUP] RAW FOLLOWUP AGENT OUTPUT: {raw_text}", flush=True)
            print(f"[FOLLOWUP] JSON parse error: {e}", flush=True)
            return {
                "status": "failed",
                "message": "Internal follow-up check error. Please answer again."
            }

        status = parsed.get("status")
        message = parsed.get("message")

        if status not in ("followup_needed", "no_followup_needed") or not isinstance(message, str):
            print(f"[FOLLOWUP] INVALID FOLLOWUP AGENT JSON: {parsed}", flush=True)
            return {
                "status": "failed",
                "message": "Internal follow-up check error. Please answer again."
            }

        print(f"\n[FOLLOWUP] Follow-up Check Done\n", flush=True)
        print(f"[FOLLOWUP] Status: {status}", flush=True)
        print(f"[FOLLOWUP] Message: {message}", flush=True)

        putMessage(meetID, message, "Jarvis")

        return {
            "status": status,
            "message": message
        }
    else:
        print(f"[FOLLOWUP] Skipping (question_number <= 2)", flush=True)
        return {
            "status": "no_followup_needed",
            "message": "The answer is sufficient to proceed."
        }