import os
import json
import requests

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROMPT_PATH = os.path.join(BASE_DIR, "..", "prompts", "initializerAgent.txt")

with open(PROMPT_PATH, "r", encoding="utf-8") as f:
    PROMPT_TEMPLATE = f.read()

def getTopicsForInterview():

    # print(PROMPT_TEMPLATE)

    res = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.1:8b",
            "prompt": PROMPT_TEMPLATE,
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

    try:
        df = json.loads(final_text)
    except Exception as e:
        print("JSON PARSE FAILED:", e)
        print("TEXT WAS:", final_text)
        return{
            "technical_topics": [
                "Convolutional Neural Network Architecture - easy",
                "Redis In-Memory Data Store - medium",
                "Kubernetes Cluster Management - medium",
                "Hash Table Collision Resolution - medium",
                "Graph-Based Recommendation Systems - easy"
            ],
            "dsa_questions": [
                "0/1 Knapsack Problem - medium",
                "Tower of Hanoi Algorithm - easy",
                "Minimum Window Substring - medium"
            ]
        }
        # hardcoded fallback in-case llm still return other than json format to continue the application

    print("\ndone generating topics\n\n")
    return df


# getTopicsForInterview()