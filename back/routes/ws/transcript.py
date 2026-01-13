from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
import json
import asyncio
import time

from back.utils.sentenceEnhancer import enhance
from back.db.utils.messages import putMessage
from ai.agents.mainAgent import startAgent

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/transcript")
async def websocket_transcript(websocket: WebSocket, meetID: str | None = None):
    await websocket.accept()
    logger.info("WebSocket connection established")

    if meetID:
        logger.info(f"WebSocket connected with meetID={meetID}")
    else:
        logger.info("WebSocket connected without meetID; will accept meetID from incoming messages if provided")

    # State
    last_transcript = ""
    transcript_version = 0

    ENHANCE_DELAY = 0.8  # seconds

    try:
        print("\n" + "="*50)
        print("Interview session started - Listening for transcriptions...")
        print("="*50 + "\n")

        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)

                # --- Interim messages (just logging) ---
                if message.get("type") == "interim" and message.get("text"):
                    interim = message["text"].strip()
                    if interim:
                        print(f"[USER - interim]: {interim}", flush=True)

                # --- Capture meetID if sent later ---
                # if message.get("meetID") and not meetID:
                #     meetID = message.get("meetID")
                #     logger.info(f"Received meetID from client message: {meetID}")

                # --- Final transcript message ---
                if message.get("type") == "transcript" and message.get("text"):
                    transcript = message["text"].strip()
                    if not transcript:
                        continue

                    print(f"[USER]: {transcript}", flush=True)

                    last_transcript = transcript
                    transcript_version += 1
                    my_version = transcript_version

                    # Debounced delayed processing
                    async def delayed_process(text_snapshot: str, version_snapshot: int):
                        try:
                            await asyncio.sleep(ENHANCE_DELAY)

                            # If a newer transcript arrived, abort
                            if version_snapshot != transcript_version:
                                return

                            # Optional: ignore very short junk
                            if len(text_snapshot.split()) < 2:
                                return

                            # --- Run enhancer in thread (non-blocking) ---
                            # newS = await asyncio.to_thread(enhance, text_snapshot)
                            
                            # # If enhancer changed too much, fallback to original
                            # if abs(len(newS) - len(text_snapshot)) > 0.5 * len(text_snapshot):
                            #     newS = text_snapshot

                            # # If it changed names or important words, fallback
                            # if "om" in text_snapshot.lower() and "om" not in newS.lower():
                            #     newS = text_snapshot

                            # # Never allow multi-line or explanations
                            # newS = newS.split("\n")[0].strip()

                            # newS = newS.strip()
                            # print(f"[ENHANCED]: {newS}", flush=True)

                            # Save to DB=
                            putMessage(meetID, text_snapshot, "user")

                            # --- Stream agent response ---
                            async for chunk in startAgent(meetID):
                                await websocket.send_text(json.dumps({
                                    "type": "ai_response_chunk",
                                    "text": chunk
                                }))

                            await websocket.send_text(json.dumps({
                                "type": "ai_response_done"
                            }))

                        except asyncio.CancelledError:
                            return
                        except Exception as e:
                            logger.error(f"Error in delayed_process: {e}", exc_info=True)

                    # Fire and forget task
                    asyncio.create_task(delayed_process(transcript, my_version))

            except Exception as e:
                logger.warning(f"Error processing message: {e}", exc_info=True)

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