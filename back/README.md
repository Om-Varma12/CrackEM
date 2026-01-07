# Interview AI Backend

FastAPI backend for receiving and displaying transcribed text from frontend.

## Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the server:**
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## Features

- **Receives transcribed text** from frontend via WebSocket
- **Displays user speech** in terminal in real-time
- **Simple and lightweight** - no ML models, just text display

## API Endpoints

- `GET /` - Health check
- `GET /health` - Health check
- `WS /ws/transcript` - WebSocket endpoint for receiving transcriptions

## How It Works

1. Frontend uses Web Speech API (browser's built-in speech recognition)
2. Frontend sends transcribed text to backend via WebSocket
3. Backend receives and prints the text to terminal

## Notes

- Speech recognition is handled by the browser (Web Speech API)
- Backend only receives and displays the transcribed text
- No ML models or heavy processing required on backend
