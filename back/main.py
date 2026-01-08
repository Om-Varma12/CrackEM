from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# router imports
from back.routes.user.sign import router as user_router
from back.routes.ws.transcript import router as ws_router
from back.routes.meet.creation import router as meetCreation_router

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Interview AI Backend")

app.include_router(user_router)
app.include_router(ws_router)
app.include_router(meetCreation_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "ok", "message": "Interview AI Backend is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}