from back.db.utils.getQs import getNoOfAskedQs
from ai.models.starterAgent import invokeStarterAgent
from back.db.utils.updateQs import incrementAskedQs

def startAgent(meetID: str):
    question = getNoOfAskedQs(meetID)
    
    if question["questionAsked"] == 0:
        response = invokeStarterAgent(meetID)
        incrementAskedQs(meetID)
        return response
    
    elif question["questionAsked"] <= question["firstHalfQ"]:
        pass
    
    elif question["questionAsked"] == question["firstHalfQ"]:
        pass
    
    elif question["questionAsked"] < question["questions"]:
        pass