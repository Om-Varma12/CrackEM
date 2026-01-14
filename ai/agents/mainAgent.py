from ai.agents.starterAgent import invokeStarterAgent
from ai.agents.technicalAgent import invokeTechnicalAgent

from back.db.allMeetFunctions import (
    getMeet,
    getQuestionAsked,
    getTopics,
    removeTopic,
    incrementAskedQs
)

async def startAgent(meetID: str):
    meet = getMeet(meetID)  # ✅ SINGLE DB HIT

    question_asked = getQuestionAsked(meet)

    if question_asked < 2:
        meet = getMeet(meetID)
        topics = getTopics(meet, "candidate_questions")

        selected_topic = None

        async for msg in invokeStarterAgent(meetID, topics):

            # Streaming token
            if msg["type"] == "chunk":
                yield msg["data"]

            # Final structured result
            elif msg["type"] == "final":
                question_text = msg["question"]
                selected_topic = msg["topic_name"]

        if selected_topic:
            removeTopic(meetID, "candidate_questions", selected_topic)
            incrementAskedQs(meetID)

    
    elif question_asked <= len(getTopics(meet, "technical_questions")):
        topics = getTopics(meet, "technical_questions")

        selected_topic = None

        async for msg in invokeTechnicalAgent(meetID, topics):

            # Streaming token
            if msg["type"] == "chunk":
                yield msg["data"]

            # Final structured result
            elif msg["type"] == "final":
                question_text = msg["question"]
                selected_topic = msg["topic_name"]

        if selected_topic:
            removeTopic(meetID, "technical_questions", selected_topic)
            incrementAskedQs(meetID)

    
    # elif question_asked["question_asked"] == question_asked["firstHalfQ"]:
    #     incrementAskedQs(meetID)
    #     async for chunk in invokeStarterAgent(meetID):
    #         yield chunk
    #     return
    
    # elif question_asked["question_asked"] < question_asked["questions"]:
    #     incrementAskedQs(meetID)
    #     async for chunk in invokeStarterAgent(meetID):
    #         yield chunk
    #     return