from back.db.utils.getQs import getNoOfAskedQs
from ai.agents.starterAgent import invokeStarterAgent
from back.db.utils.updateQs import incrementAskedQs
from back.db.utils.retrieveTopic import getTopics

async def startAgent(meetID: str):
    question = getNoOfAskedQs(meetID)
    
    if question["questionAsked"] < 3:
        topics = getTopics(meetID, "candidate_questions")

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
            # removeTopic(meetID, selected_topic)   # <-- you implement this
            incrementAskedQs(meetID)
        return

    
    elif question["questionAsked"] <= question["firstHalfQ"]:
        incrementAskedQs(meetID)
        async for chunk in invokeStarterAgent(meetID):
            yield chunk
        return
    
    elif question["questionAsked"] == question["firstHalfQ"]:
        incrementAskedQs(meetID)
        async for chunk in invokeStarterAgent(meetID):
            yield chunk
        return
    
    elif question["questionAsked"] < question["questions"]:
        incrementAskedQs(meetID)
        async for chunk in invokeStarterAgent(meetID):
            yield chunk
        return