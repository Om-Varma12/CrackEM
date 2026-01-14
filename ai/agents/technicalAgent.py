import os
import json
import httpx

from back.db.utils.messages import putMessage


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROMPT_PATH = os.path.join(BASE_DIR, "..", "prompts", "techincalAgent.txt")


with open(PROMPT_PATH, "r", encoding="utf-8") as f:
    PROMPT_TEMPLATE = f.read()

async def invokeTechnicalAgent(meetID, topics):
    topics_str = ", ".join(topics)
    prompt = PROMPT_TEMPLATE.replace("<topics>", topics_str)

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

                            # Stream to frontend
                            yield {
                                "type": "chunk",
                                "data": chunk
                            }

                        if data.get("done", False):
                            pass
                    except json.JSONDecodeError:
                        pass

    print("RAW LLM OUTPUT:", final_text)

    # -------------------------------
    # Parse JSON returned by LLM
    # -------------------------------
    try:
        parsed = json.loads(final_text)
    except Exception as e:
        print("LLM did not return valid JSON:", e)
        return

    question = parsed["question"]
    topic_name = parsed["topic_name"]

    # Save only the question to DB
    putMessage(meetID, question, "Jarvis")

    # Final signal to caller
    yield {
        "type": "final",
        "question": question,
        "topic_name": topic_name
    }

    # No return needed as it is a generator, usage will be consuming the yields

# print(invokeStarterAgent("l6f427tb1b9tzruonjpjd", ["intro of candidate", "strenghts and weaknesses", "tech stack", "candidate preferences", "interests"]))