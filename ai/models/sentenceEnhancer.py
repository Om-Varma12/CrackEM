import os
import json
import requests

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROMPT_PATH = os.path.join(BASE_DIR, "..", "prompts", "sentenceEnhancer.txt")

with open(PROMPT_PATH, "r", encoding="utf-8") as f:
    PROMPT_TEMPLATE = f.read()

def enhance_sentence(sentence: str):
    prompt = PROMPT_TEMPLATE.format(sentence=sentence)

    res = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "gnokit/improve-grammar",
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

    return final_text