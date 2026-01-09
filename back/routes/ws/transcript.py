from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
import json

from back.utils.sentenceEnhancer import enhance

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/transcript")
async def websocket_transcript(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection established")

    try:
        print("\n" + "="*50)
        print("Interview session started - Listening for transcriptions...")
        print("="*50 + "\n")

        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)

                if message.get("type") == "interim" and message.get("text"):
                    interim = message["text"].strip()
                    if interim:
                        print(f"[USER - interim]: {interim}", flush=True)

                if message.get("type") == "transcript" and message.get("text"):
                    transcript = message["text"].strip()

                    if transcript:
                        print(f"[USER]: {transcript}", flush=True)
                        newS = enhance(transcript)
                        print(f"[ENHANCED]: {newS}", flush=True)

            except json.JSONDecodeError:
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
        try:
            await websocket.close()
        except:
            pass
