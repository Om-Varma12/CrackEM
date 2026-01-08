from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import json

#local imports
from back.utils.sentenceEnhancer import enhance

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Interview AI Backend")

# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Interview AI Backend is running"}


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.websocket("/ws/transcript")
async def websocket_transcript(websocket: WebSocket):
    """
    WebSocket endpoint for receiving transcribed text from frontend
    Displays user speech in terminal
    """
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    try:
        print("\n" + "="*50)
        print("Interview session started - Listening for transcriptions...")
        print("="*50 + "\n")
        
        while True:
            # Receive text data from frontend
            data = await websocket.receive_text()
            
            try:
                # Parse JSON message
                message = json.loads(data)
                
                if message.get("type") == "transcript" and message.get("text"):
                    transcript = message["text"].strip()
                    
                    if transcript:
                        # Print transcript to terminal
                        print(f"[USER]: {transcript}", flush=True)
                        newS = enhance(transcript)
                        print(f"[ENHANCED]: {newS}", flush=True)
                
            except json.JSONDecodeError:
                # If not JSON, treat as plain text
                if data.strip():
                    print(f"[USER]: {data.strip()}", flush=True)
            except Exception as e:
                logger.warning(f"Error processing message: {e}")
    
    except WebSocketDisconnect:
        logger.info("WebSocket connection closed")
        print("\n" + "="*50)
        print("Interview session ended")
        print("="*50 + "\n")
    except Exception as e:
        logger.error(f"Error in WebSocket connection: {e}", exc_info=True)
        print(f"\n[ERROR]: Connection error: {e}\n")
        try:
            await websocket.close()
        except:
            pass