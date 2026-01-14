from back.db.welcome import getNameForWelcome
from back.db.utils.messages import putMessage

s = "I'm Jarvis, your AI interviewer. I'll be guiding you through today's interview. Let's begin."

def sayFirstMessage(session_id: str, meetID: str):
    name = getNameForWelcome(session_id)
    
    message = "Hello " + name + "! " + s
    # putMessage(meetID, message, "Jarvis")
    
    return "Hello there, lets start the interview!"