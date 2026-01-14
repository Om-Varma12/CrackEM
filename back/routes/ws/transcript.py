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
    # State
    last_transcript = ""
    transcript_version = 0
    # Store lastLLMResponse as a local variable that can be updated
    current_last_response = lastLLMResponse  # Initialize from query param if provided

    ENHANCE_DELAY = 0.8  # seconds

    try:
        print("\n" + "="*50)
        print("Interview session started - Listening for transcriptions...")
        print("="*50 + "\n")

        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)

                # --- UPDATE: Extract lastLLMResponse from message ---
                if message.get("lastLLMResponse"):
                    current_last_response = message.get("lastLLMResponse")
                    # print(f"[DEBUG] Updated lastLLMResponse from message: {current_last_response[:100] if current_last_response else 'None'}", flush=True)

                # --- Interim messages (just logging) ---
                if message.get("type") == "interim" and message.get("text"):
                    interim = message["text"].strip()
                    if interim:
                        print(f"[USER - interim]: {interim}", flush=True)

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
                        nonlocal current_last_response  # ← Use current_last_response instead

                        try:
                            await asyncio.sleep(ENHANCE_DELAY)

                            if version_snapshot != transcript_version:
                                print(f"[DEBUG] Skipping stale transcript version {version_snapshot}", flush=True)
                                return

                            if not text_snapshot.strip():
                                print(f"[DEBUG] Skipping empty transcript", flush=True)
                                return

                            putMessage(meetID, text_snapshot, "user")

                            print(f"[DEBUG] Validating response...", flush=True)
                            result = await validate(meetID, current_last_response or "", text_snapshot)
                            print(f"[DEBUG] VALIDATION RESULT = {result}", flush=True)

                            status = (result.get("status") or "").lower().strip()

                            if status == "success":
                                user_answer = text_snapshot

                                if current_last_response and current_last_response.strip():
                                    # print(f"[DEBUG] Checking followup for question: {current_last_response[:100]}", flush=True)
                                    print(f"[DEBUG] User answer: {user_answer[:100]}", flush=True)
                                    
                                    followup_result = await followUp(meetID, current_last_response, user_answer)
                                    print(f"\n\n[DEBUG] FOLLOWUP RESULT = {followup_result}", flush=True)
                                    
                                    if followup_result["status"] == "followup_needed":
                                        followup_question = followup_result["message"]
                                        print(f"[DEBUG] Sending followup question: {followup_question[:100]}", flush=True)

                                        await websocket.send_text(json.dumps({
                                            "type": "ai_response_chunk",
                                            "text": followup_question
                                        }))

                                        await websocket.send_text(json.dumps({
                                            "type": "ai_response_done"
                                        }))

                                        current_last_response = followup_question
                                        print(f"[DEBUG] Updated current_last_response, exiting delayed_process", flush=True)
                                        return
                                    else:
                                        print(f"[DEBUG] No followup needed, proceeding to main agent", flush=True)
                                else:
                                    print(f"[DEBUG] No current_last_response, skipping followup check", flush=True)

                                print(f"[DEBUG] Starting main agent...", flush=True)
                                final_answer = ""

                                async for chunk in startAgent(meetID):
                                    final_answer += chunk
                                    await websocket.send_text(json.dumps({
                                        "type": "ai_response_chunk",
                                        "text": chunk
                                    }))

                                current_last_response = final_answer
                                print(f"[DEBUG] Main agent complete, updated current_last_response", flush=True)

                                await websocket.send_text(json.dumps({
                                    "type": "ai_response_done"
                                }))

                            else:
                                print(f"[DEBUG] Validation failed: {result.get('message')}", flush=True)
                                msg = result.get("message", "Validation failed")
                                
                                await websocket.send_text(json.dumps({
                                    "type": "ai_response_chunk",
                                    "text": msg
                                }))

                                await websocket.send_text(json.dumps({
                                    "type": "ai_response_done"
                                }))

                                current_last_response = msg
                                return

                        except asyncio.CancelledError:
                            print(f"[DEBUG] delayed_process cancelled", flush=True)
                            return
                        except Exception as e:
                            logger.error(f"[DEBUG] Error in delayed_process: {e}", exc_info=True)
                            print(f"[DEBUG] Exception in delayed_process: {e}", flush=True)

                    # Fire and forget task
                    asyncio.create_task(delayed_process(transcript, my_version))

            except Exception as e:
                logger.warning(f"Error processing message: {e}", exc_info=True)

    except WebSocketDisconnect:
        print("\n" + "="*50)
        print("Interview session ended")
        print("="*50 + "\n")

    except Exception as e:
        logger.error(f"Error in WebSocket connection: {e}", exc_info=True)
        try:
            await websocket.close()
        except:
            pass