from back.db.utils.getQs import getNoOfAskedQs
from ai.models.starterAgent import invokeStarterAgent
from back.db.utils.updateQs import incrementAskedQs

async def startAgent(meetID: str):
    question = getNoOfAskedQs(meetID)
    
    if question["questionAsked"] == 0:
        incrementAskedQs(meetID)
        async for chunk in invokeStarterAgent(meetID):
            yield chunk
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