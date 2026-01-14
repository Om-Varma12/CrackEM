# 🗺️ CrackEM Project Map

**Project**: AI-Powered Technical Interview Simulation Platform  
**Last Updated**: January 13, 2026  
**Status**: Early Development Phase (Hackathon Project)

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Currently Implemented Features](#currently-implemented-features)
4. [Tech Stack](#tech-stack)
5. [Directory Structure](#directory-structure)
6. [Core Components](#core-components)
7. [API Endpoints](#api-endpoints)
8. [Database Schema](#database-schema)
9. [AI/LLM Integration](#aillm-integration)
10. [Planned Features (Roadmap)](#planned-features-roadmap)
11. [Development Guide](#development-guide)
12. [Known Limitations](#known-limitations)

---

## 🎯 Project Overview

CrackEM (also referred to as CheckCM in UI) is an AI-driven interview simulation platform that helps candidates practice various types of technical and behavioral interviews. The platform uses video and voice interaction, real-time AI responses, GitHub profile analysis, and provides comprehensive feedback and progress tracking.

**Core Value Proposition**: Practice role-specific interviews (HR, Technical, System Design, DSA) with an AI interviewer that adapts based on your experience level, target company style, and GitHub profile. Get personalized feedback and track your interview readiness.

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────┐         WebSocket         ┌──────────────┐
│   Frontend  │◄─────────────────────────►│   Backend    │
│  (React +   │    REST API (Auth/Meet)   │  (FastAPI)   │
│   Vite)     │◄─────────────────────────►│              │
└─────────────┘                            └──────┬───────┘
      │                                           │
      │ Web Speech API                            │
      │ (Browser Native)                          │
      │                                           │
      └───────────────────────────────────────────┘
                                                  │
                                    ┌─────────────┼──────────────┐
                                    │             │              │
                              ┌─────▼────┐  ┌────▼─────┐  ┌────▼─────┐
                              │ MongoDB  │  │  Ollama  │  │ AI Logic │
                              │   DB     │  │(Llama3.1)│  │  Agents  │
                              └──────────┘  └──────────┘  └──────────┘
```

### Communication Flow

1. **User Authentication**: REST API → MongoDB
2. **Interview Session**: WebSocket connection established with `meetID`
3. **Speech Recognition**: Browser's Web Speech API → Frontend
4. **Transcription Streaming**: Frontend WebSocket → Backend
5. **AI Processing**: Backend → Ollama (local LLM) → Streaming response
6. **Response Display**: Backend WebSocket → Frontend (typewriter effect)

---

## ✅ Currently Implemented Features

### 🔐 Authentication & User Management
- ✅ User signup/signin (REST API)
- ✅ Session management via cookies
- ✅ Zustand store for frontend auth state
- ✅ Protected routes

### 🎤 Real-Time Voice Interaction
- ✅ Browser-based speech recognition (Web Speech API)
- ✅ Real-time transcription streaming to backend
- ✅ WebSocket bidirectional communication
- ✅ Interim transcript display (while speaking)
- ✅ Final transcript processing
- ✅ Silence detection and buffering

### 🤖 AI Interviewer
- ✅ Basic conversational AI using Ollama (Llama 3.1 8B)
- ✅ Streaming responses (typewriter effect)
- ✅ Context-aware responses (conversation history)
- ✅ "Starter/Warmup" agent (initial questions)
- ✅ Question progression logic (tracks # of questions asked)
- ✅ Conversation history stored in MongoDB
- ⚠️ Real-time transcription (implemented, browser-based)
- ❌ Video-integrated AI interviewer (planned)
- ❌ Audio replies from AI (planned)
- ❌ Video monitoring for behavior/posture (planned)

### 📹 Interview Interface
- ✅ User camera component (video preview)
- ✅ AI avatar component
- ✅ Interview controls (start/stop)
- ✅ Interview timer
- ✅ Question display with typewriter animation
- ✅ Real-time transcript display

### 🎨 UI/UX
- ✅ Modern UI with shadcn/ui components
- ✅ Glassmorphism design
- ✅ Framer Motion animations
- ✅ GSAP smooth scrolling and transitions
- ✅ Responsive design
- ✅ Dark mode support

### 💾 Database
- ✅ MongoDB integration
- ✅ User collection
- ✅ Session management
- ✅ Meet (interview session) collection
- ✅ Message history storage
- ✅ Question tracking per meet

### 🛠️ Infrastructure
- ✅ FastAPI backend with CORS
- ✅ WebSocket endpoint
- ✅ Environment variable management
- ✅ Modular route structure
- ✅ Logging system

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion + GSAP
- **HTTP Client**: TanStack Query
- **Routing**: React Router DOM
- **Speech**: Web Speech API (browser native)

### Backend
- **Framework**: FastAPI (Python)
- **WebSocket**: FastAPI WebSockets + `websockets` library
- **Database**: MongoDB (via PyMongo)
- **LLM Integration**: Ollama (local, Llama 3.1 8B model)
- **HTTP Client**: httpx (for async Ollama calls)

### AI/ML
- **LLM**: Llama 3.1 8B (via Ollama)
- **Deployment**: Local Ollama server (port 11434)
- **Streaming**: Token-by-token streaming

### DevOps
- **Frontend Dev Server**: Vite (port 8080)
- **Backend Server**: Uvicorn (port 8000)
- **Database**: MongoDB (cloud or local)

---

## 📁 Directory Structure

```
CrackEM/
├── front/                      # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # Auth modal, navbar
│   │   │   ├── interview/     # Interview UI components
│   │   │   ├── navigation/    # Routes
│   │   │   └── ui/            # shadcn components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities (API, utils)
│   │   ├── pages/             # Page components
│   │   ├── store/             # Zustand stores
│   │   └── types/             # TypeScript definitions
│   └── package.json
│
├── back/                       # FastAPI backend
│   ├── routes/
│   │   ├── user/              # Auth routes
│   │   ├── meet/              # Interview session routes
│   │   └── ws/                # WebSocket routes
│   ├── db/                    # Database operations
│   │   └── utils/             # DB helper functions
│   ├── schema/                # Pydantic schemas
│   ├── services/              # Business logic
│   ├── utils/                 # Utility functions
│   ├── main.py                # FastAPI app entry
│   └── requirements.txt
│
├── ai/                         # AI/LLM logic
│   ├── models/                # AI agent implementations
│   │   ├── agent.py           # Main agent controller
│   │   ├── starterAgent.py    # Warmup question agent
│   │   └── sentenceEnhancer.py # Text enhancement (unused)
│   ├── prompts/               # Prompt templates
│   └── assets/                # Question bank (empty)
│
└── package.json               # Root package.json (minimal)
```

---

## 🧩 Core Components

### Frontend Components

#### `useSpeechRecognition` Hook
- **Location**: `front/src/hooks/useSpeechRecognition.ts`
- **Purpose**: Manages Web Speech API
- **Key Features**:
  - Start/stop recognition
  - Interim transcript handling
  - Silence detection (1000ms)
  - WebSocket communication
  - Throttled interim updates (400ms)
  - AI response streaming handling

#### `QuestionDisplay` Component
- **Location**: `front/src/components/interview/QuestionDisplay.tsx`
- **Purpose**: Displays AI questions with typewriter effect
- **Features**:
  - Character-by-character animation (30ms delay)
  - GSAP smooth scrolling
  - Entrance animations

#### `AuthModal` Component
- **Location**: `front/src/components/auth/AuthModal.tsx`
- **Purpose**: Handles signup/signin
- **Integration**: Zustand store + API calls

### Backend Components

#### WebSocket Transcript Handler
- **Location**: `back/routes/ws/transcript.py`
- **Purpose**: Core interview communication hub
- **Flow**:
  1. Accept WebSocket connection with `meetID`
  2. Receive interim/final transcripts
  3. Store user messages in DB
  4. Invoke AI agent
  5. Stream AI response back to frontend

#### AI Agent System
- **Location**: `ai/models/agent.py`
- **Purpose**: Orchestrates interview flow
- **Logic**:
  - Tracks question count
  - Routes to appropriate agent (currently only starterAgent)
  - Manages interview phases

#### Starter Agent
- **Location**: `ai/models/starterAgent.py`
- **Purpose**: Warmup/introduction questions
- **Features**:
  - Loads conversation history
  - Constructs prompt with history
  - Streams response from Ollama
  - Saves AI response to DB

---

## 🔌 API Endpoints

### REST Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/` | Health check | No |
| GET | `/health` | Health check | No |
| POST | `/user/signup` | User registration | No |
| POST | `/user/signin` | User login | No |
| GET | `/meet/create` | Create interview session | Yes (cookie) |
| GET | `/meet/welcome` | Welcome message | Yes |

### WebSocket Endpoints

| Endpoint | Purpose | Parameters |
|----------|---------|------------|
| `WS /ws/transcript` | Real-time interview communication | `meetID` (query param) |

**WebSocket Message Format**:
```json
// Client → Server (Interim)
{
  "type": "interim",
  "text": "Hello I am..."
}

// Client → Server (Final)
{
  "type": "transcript",
  "text": "Hello I am Om"
}

// Server → Client (AI Response)
{
  "type": "ai_response",
  "chunk": "That's interesting...",
  "done": false
}
```

---

## 💾 Database Schema

### Collections

#### `users`
```javascript
{
  "_id": ObjectId,
  "username": String,
  "email": String,        // Unique
  "password": String,     // Hashed
  "createdAt": DateTime
}
```

#### `sessions`
```javascript
{
  "_id": ObjectId,
  "session_id": String,   // Unique, used in cookies
  "user_id": ObjectId,    // Reference to users
  "createdAt": DateTime
}
```

#### `meets` (Interview Sessions)
```javascript
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "meet_id": String,      // Unique identifier
  "questions": Number,     // Total questions to ask
  "firstHalfQ": Number,   // Warmup questions count
  "secondHalfQ": Number,  // Technical questions count
  "question_asked": Number, // Current question index
  "createdAt": DateTime
}
```

#### `messages` (Conversation History)
```javascript
{
  "_id": ObjectId,
  "meet_id": String,
  "message": String,
  "sender": String,       // "user" or "Jarvis"
  "timestamp": DateTime
}
```

#### `profiles` (User Profiles - Planned)
```javascript
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "resume": {
    "file_url": String,
    "parsed_data": Object,  // Extracted skills, experience, etc.
    "uploaded_at": DateTime
  },
  "github": {
    "username": String,
    "profile_url": String,
    "detected_tech_stack": [String],
    "projects": [{
      "name": String,
      "description": String,
      "technologies": [String],
      "stars": Number,
      "contribution_level": String
    }],
    "primary_languages": [String],
    "last_synced": DateTime
  },
  "preferred_tech_stack": [String],
  "ai_analysis": {
    "strengths": [String],
    "improvement_areas": [String],
    "project_quality_score": Number,
    "recommendations": [String]
  },
  "createdAt": DateTime,
  "updatedAt": DateTime
}
```

#### `interview_settings` (Planned)
```javascript
{
  "_id": ObjectId,
  "meet_id": String,
  "interview_type": String,  // "Phone Screening", "Coding", "System Design", etc.
  "role": String,             // "Sr. Engineer", "HR", "Tech Lead", etc.
  "difficulty": String,       // "Easy", "Medium", "Hard"
  "pace": String,            // "Fast", "Medium", "Slow"
  "experience_level": String, // "Fresher", "Junior", "Mid", "Senior"
  "target_company_style": String, // "FAANG", "Startup", etc.
  "createdAt": DateTime
}
```

#### `progress_tracking` (Planned)
```javascript
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "readiness_score": Number,  // 0-100
  "skills": {
    "dsa": Number,            // 0-100
    "system_design": Number,
    "behavioral": Number,
    "communication": Number,
    "domain_knowledge": Number
  },
  "weakness_areas": [String],
  "strength_areas": [String],
  "recommended_focus": [String],
  "interviews_completed": Number,
  "improvement_trend": String, // "Improving", "Stable", "Declining"
  "last_calculated": DateTime
}
```

---

## 🤖 AI/LLM Integration

### Current Implementation

**Model**: Llama 3.1 8B (via Ollama)  
**Endpoint**: `http://localhost:11434/api/generate`  
**Mode**: Streaming (token-by-token)

### Prompt Engineering

#### Starter Agent Prompt
**Location**: `ai/prompts/starterAgent.txt`

**Structure**:
- Role definition (interviewer)
- Task: Ask warmup questions
- Context injection: `<<MEET_HISTORY_FROM_DATABASE>>`
- Constraints:
  - No explanations
  - Warmup questions only
  - Follow-up based on previous answers
  - No technical questions yet

**Sample Flow**:
1. First message: "Hi, could you introduce yourself?"
2. After introduction: Compliment + follow-up
3. Example: "That's impressive! What projects are you most proud of?"

### Agent State Machine

**Current State**:
```python
# In agent.py
if question_asked == 0:           # First question
    → starterAgent
elif question_asked <= firstHalfQ: # Warmup phase
    → starterAgent
elif question_asked < total:       # Future: technical phase
    → starterAgent (placeholder)
```

**Planned State Machine** (not implemented):
- Warmup Phase → Technical Question Phase → Planning Phase → Coding Phase → Discussion Phase

---

## 🚀 Planned Features (Roadmap)

### Priority 1: Interview Setup & Configuration

#### 🎯 Interview Customization
- [ ] Interview type selection
  - [ ] Phone Screening
  - [ ] Coding Rounds
  - [ ] System Design
  - [ ] Behavioral/HR
  - [ ] DSA (Data Structures & Algorithms) Rounds
- [ ] Role-based interviews (HR, Sr. Engineer, Tech Lead, Manager, etc.)
- [ ] Interview difficulty levels (Easy, Medium, Hard)
- [ ] Interview pace settings (Fast, Medium, Slow paced)
- [ ] Experience level selection (Fresher, Junior, Mid-level, Senior)
- [ ] Target company style tuning
  - [ ] FAANG-style interviews
  - [ ] Startup-style interviews
  - [ ] Product-based companies
  - [ ] Service-based companies
- [ ] Dynamic question alteration based on role and post

### Priority 2: AI Interviewer Enhancements

#### 🎥 Video & Audio Integration
- [ ] Video-integrated AI interviewer avatar
- [ ] AI audio replies (Text-to-Speech)
- [ ] Lip-sync for AI avatar
- [ ] Multiple AI interviewer personas (different styles)

#### 📹 Video Monitoring & Analysis
- [ ] Real-time video monitoring of candidate
- [ ] Behavior analysis (eye contact, fidgeting, confidence)
- [ ] Posture detection and feedback
- [ ] Facial expression analysis
- [ ] Body language scoring

#### 🧠 Advanced Interview Brain
- [ ] Multi-phase interview state machine
  - [ ] Introduction/Warmup Phase
  - [ ] Technical Question Phase
  - [ ] Problem-Solving Phase
  - [ ] Behavioral Question Phase
  - [ ] Closing/Q&A Phase
- [ ] Phase-based question adaptation
- [ ] Context-aware interruptions
- [ ] Live follow-up questions based on answers
- [ ] Clarification question handling
- [ ] Time management enforcement per phase

### Priority 3: Profile Builder & GitHub Integration

#### 👤 Profile Creation
- [ ] Resume upload and parsing
- [ ] GitHub profile integration
  - [ ] Automatic tech stack detection from repositories
  - [ ] Project data extraction
  - [ ] Contribution analysis
  - [ ] Language proficiency detection
- [ ] Tech stack preference selection
- [ ] AI-powered profile analysis
  - [ ] Project quality assessment
  - [ ] Technology strength mapping
  - [ ] Recommendations for improvement
- [ ] Store extracted project data for interview questions
- [ ] Project-based question generation
  - [ ] "Tell me about [your project name]"
  - [ ] "How did you handle [specific challenge in project]?"
  - [ ] "What would you improve in [project]?"

### Priority 4: Progress Tracking & Readiness

#### 📊 Progress Dashboard
- [ ] Interview readiness score (percentage)
- [ ] Skill-wise breakdown
  - [ ] DSA proficiency
  - [ ] System Design knowledge
  - [ ] Behavioral/Communication skills
  - [ ] Domain-specific skills
- [ ] Areas to improve (weakness detection)
- [ ] Recommended focus areas
- [ ] Interview attempt history
- [ ] Performance trends over time
- [ ] Strengths highlighting

#### 📈 Analytics & Insights
- [ ] Interview-by-interview improvement tracking
- [ ] Comparison with target role requirements
- [ ] Time-to-ready estimation
- [ ] Skill gap analysis
- [ ] Personalized learning path

### Priority 5: Practice Section

#### 🎓 Job-Based Practice
- [ ] Dedicated practice area for specific job roles
  - [ ] Frontend Developer practice
  - [ ] Backend Developer practice
  - [ ] Full Stack Developer practice
  - [ ] DevOps Engineer practice
  - [ ] Data Scientist/ML Engineer practice
  - [ ] System Designer practice
- [ ] Role-specific question banks
- [ ] Practice problems aligned with job requirements
- [ ] Topic-wise practice modules
- [ ] Difficulty progression system

### Priority 6: Home Page & Dashboard

#### 🏠 Dashboard Features
- [ ] Overview of interview readiness
- [ ] Quick stats (interviews taken, avg. score, improvement)
- [ ] Skill overview cards
  - [ ] DSA skill level
  - [ ] System Design skill level
  - [ ] Behavioral skill level
  - [ ] Domain knowledge level
- [ ] Recent interview history
- [ ] Upcoming practice recommendations
- [ ] Achievement badges/milestones
- [ ] Quick start interview button
- [ ] Resume status indicator

### Priority 7: Content System

#### 🗂️ Question Bank
- [ ] Role-tagged question bank
- [ ] Difficulty-tagged problems
- [ ] Interview-type categorization
- [ ] Company-style tagged questions (FAANG, Startup, etc.)
- [ ] Populate `ai/assets/Qs.json` with structured questions
- [ ] Dynamic question selection based on profile and settings

---

## 👨‍💻 Development Guide

### Setup Instructions

#### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)
- Ollama with Llama 3.1 8B model

#### Frontend Setup
```bash
cd front
npm install
npm run dev  # Runs on port 8080
```

#### Backend Setup
```bash
cd back
pip install -r requirements.txt

# Create .env file
MONGO_URI=mongodb://localhost:27017  # or Atlas URI

# Run server
python main.py  # Runs on port 8000
```

#### Ollama Setup
```bash
# Install Ollama
# Download from https://ollama.ai

# Pull Llama 3.1 model
ollama pull llama3.1:8b

# Verify running
ollama list
```

### Key Configuration

#### Frontend API Base URL
**Location**: `front/src/lib/api.ts`  
Currently points to `http://localhost:8000`

#### CORS Settings
**Location**: `back/main.py`  
Allows: `http://localhost:8080`, `http://127.0.0.1:8080`

#### WebSocket URL
**In frontend code**: `ws://localhost:8000/ws/transcript?meetID={meetID}`

### Development Workflow

1. **Start MongoDB**
2. **Start Ollama**: `ollama serve` (if not running as service)
3. **Start Backend**: `cd back && python main.py`
4. **Start Frontend**: `cd front && npm run dev`
5. **Open Browser**: `http://localhost:8080`

### Adding New AI Agents

1. Create agent file in `ai/models/`
2. Create prompt template in `ai/prompts/`
3. Implement streaming generator function
4. Update routing logic in `ai/models/agent.py`
5. Ensure DB message logging

**Template**:
```python
async def invokeNewAgent(meetID: str):
    context = getMeetMessages(meetID)
    prompt = PROMPT_TEMPLATE.replace("<<CONTEXT>>", context)
    
    final_text = ""
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            "http://localhost:11434/api/generate",
            json={"model": "llama3.1:8b", "prompt": prompt, "stream": True}
        ) as response:
            async for line in response.aiter_lines():
                # Parse and yield chunks
                
    putMessage(meetID, final_text, "Jarvis")
```

---

## ⚠️ Known Limitations

### Current Limitations

1. **Single Agent Type**: Only warmup questions implemented
2. **No Interview Setup**: Can't select interview type, role, or difficulty yet
3. **No Profile Builder**: GitHub integration not implemented
4. **No Video AI**: AI interviewer doesn't have video avatar
5. **No Audio Replies**: AI responses are text-only (no TTS)
6. **No Video Monitoring**: Can't analyze candidate behavior/posture
7. **No Progress Tracking**: No readiness score or analytics dashboard
8. **No Practice Section**: Job-based practice not implemented
9. **No Question Bank**: `Qs.json` is empty
10. **Basic Error Handling**: Limited error recovery
11. **Single Language**: Only English supported
12. **Local LLM Only**: Requires Ollama running locally

### Technical Debt

1. **Sentence Enhancer**: Implemented but disabled (commented out in transcript.py)
2. **Message Buffering**: Simple implementation, could be optimized
3. **No Retry Logic**: WebSocket/API failures not handled
4. **Hard-coded Timeouts**: Should be configurable
5. **No Rate Limiting**: API can be spammed
6. **Plaintext Passwords**: Should use bcrypt/argon2 (likely not implemented yet)
7. **No Input Validation**: Limited Pydantic validation

### Browser Compatibility

- **Web Speech API**: Only works in Chrome, Edge, Safari
- **Not supported**: Firefox (as of 2026)

---

## 🎯 Quick Reference: What Works vs What's Planned

| Feature | Status | Notes |
|---------|--------|-------|
| User Auth | ✅ Working | Signup/Signin with sessions |
| Voice Recognition | ✅ Working | Browser-based, Chrome only |
| AI Responses | ✅ Working | Warmup questions only |
| Streaming Responses | ✅ Working | Typewriter effect |
| Conversation History | ✅ Working | Stored in MongoDB |
| Interview Setup | ❌ Planned | Type, role, difficulty selection |
| Video AI Interviewer | ❌ Planned | Avatar with video/audio |
| Audio Replies (TTS) | ❌ Planned | AI voice responses |
| Video Monitoring | ❌ Planned | Behavior/posture analysis |
| Profile Builder | ❌ Planned | Resume + GitHub integration |
| GitHub Analysis | ❌ Planned | Tech stack detection |
| Progress Dashboard | ❌ Planned | Readiness tracking |
| Job-Based Practice | ❌ Planned | Role-specific practice |
| Multi-Phase Interviews | ⚠️ Partial | Only warmup phase works |
| Question Bank | ❌ Empty | Qs.json is empty |

---

## 📝 Notes for AI Assistants

When working on this project:

1. **Always maintain streaming**: Use async generators for AI responses
2. **Preserve conversation history**: Call `putMessage()` for all interactions
3. **Update question counter**: Use `incrementAskedQs()` when asking new questions
4. **Follow agent pattern**: Create separate agent files for different interview phases
5. **Keep prompts in text files**: Don't hardcode prompts in Python
6. **Use WebSocket for real-time**: Avoid REST for interview communication
7. **Test with Ollama**: Ensure Llama 3.1 8B is running before testing
8. **Consider token limits**: Conversation history grows, may need truncation
9. **Maintain phase logic**: Update agent.py state machine when adding new phases
10. **Document in this map**: Update this file when implementing new features

---

## 🤝 Contributing

For hackathon team members:

1. Check "Planned Features" section for TODO items
2. Update this map when implementing features
3. Follow existing code patterns (FastAPI routes, React hooks)
4. Test with real speech input
5. Ensure Ollama responses are coherent before committing
6. Update database schemas if adding collections

---

**End of Project Map** | For questions, check code comments or ask the team.
