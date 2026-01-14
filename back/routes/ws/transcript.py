from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
import json
import asyncio
import time

from back.utils.sentenceEnhancer import enhance
from back.db.utils.messages import putMessage
from ai.agents.mainAgent import startAgent
from ai.agents.validationAgent import validate
from ai.agents.followupAgent import followUp

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/transcript")
async def websocket_transcript(websocket: WebSocket, meetID: str | None = None, lastLLMResponse: str | None = None):
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
                        nonlocal lastLLMResponse   # 🔥 THIS FIXES IT

                        try:
                            await asyncio.sleep(ENHANCE_DELAY)

                            if version_snapshot != transcript_version:
                                return

                            if not text_snapshot.strip():
                                return

                            putMessage(meetID, text_snapshot, "user")

                            result = await validate(lastLLMResponse or "", text_snapshot)
                            print("VALIDATION RESULT =", result, flush=True)

                            status = (result.get("status") or "").lower().strip()

                            if status == "success":
                                user_answer = text_snapshot

                                if lastLLMResponse and lastLLMResponse.strip():
                                    followup_result = await followUp(meetID, lastLLMResponse, user_answer)

                                    if followup_result["status"] == "followup_needed":
                                        followup_question = followup_result["message"]

                                        await websocket.send_text(json.dumps({
                                            "type": "ai_response_chunk",
                                            "text": followup_question
                                        }))

                                        await websocket.send_text(json.dumps({
                                            "type": "ai_response_done"
                                        }))

                                        lastLLMResponse = followup_question
                                        return

                                final_answer = ""

                                async for chunk in startAgent(meetID):
                                    final_answer += chunk
                                    await websocket.send_text(json.dumps({
                                        "type": "ai_response_chunk",
                                        "text": chunk
                                    }))

                                lastLLMResponse = final_answer

                                await websocket.send_text(json.dumps({
                                    "type": "ai_response_done"
                                }))


                            else:
                                msg = result.get("message", "Validation failed")
                                # Send like normal AI response (but in one chunk)
                                await websocket.send_text(json.dumps({
                                    "type": "ai_response_chunk",
                                    "text": msg
                                }))

                                await websocket.send_text(json.dumps({
                                    "type": "ai_response_done"
                                }))

                                # Also update lastLLMResponse so next answer is validated against this
                                lastLLMResponse = msg

                                return

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