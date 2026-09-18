# PulsePoll - Real-Time Live Polling Web Application

![PulsePoll Banner](https://img.shields.io/badge/PulsePoll-Live%20Realtime%20Polling-indigo?style=for-the-badge)
![Go](https://img.shields.io/badge/Go-1.22.5-blue?style=for-the-badge&logo=go)
![Gin](https://img.shields.io/badge/Gin-v1.9.1-cyan?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-HINCRBY-red?style=for-the-badge&logo=redis)
![WebSockets](https://img.shields.io/badge/WebSockets-Gorilla-violet?style=for-the-badge)

> **HCL GUVI Internship Evaluation Project**  
> A production-ready, full-stack live polling application enabling sub-second realtime vote synchronization across multiple devices without requiring page refreshes.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack Architecture](#-tech-stack-architecture)
- [Real-Time Logical Flow & Redis HINCRBY Engine](#-real-time-logical-flow--redis-hincrby-engine)
- [Database Consistency Strategy](#-database-consistency-strategy)
- [Monorepo Directory Structure](#-monorepo-directory-structure)
- [Environment Variables](#-environment-variables)
- [Local Installation & Development Guide](#-local-installation--development-guide)
- [REST API Documentation](#-rest-api-documentation)
- [WebSocket API Specification](#-websocket-api-specification)
- [Security & Validation Features](#-security--validation-features)
- [Deployment Instructions](#-deployment-instructions)
- [AI Tooling & Development Disclosure](#-ai-tooling--development-disclosure)

---

## 🚀 Project Overview

PulsePoll solves the problem of friction-filled live audience feedback during presentations, events, and classrooms. 

### Key Features:
1. **Instant Poll Creation:** Authenticated creators publish questions with custom options and optional expiration limits (10m, 1h, 24h).
2. **Seamless Shareability:** Generates unique share links and embedded **QR Codes** for instant mobile scanning.
3. **Frictionless Public Voting:** Audience members vote immediately without requiring signup.
4. **Sub-Second Realtime Synchronization:** When any user votes on any browser or phone, all connected watching devices receive live state updates **WITHOUT refreshing the page**.
5. **Anti-Duplicate Vote Protection:** Session identifier tracking prevents multiple accidental votes from the same browser context.

---

## 🛠 Tech Stack Architecture

The four core mandatory technologies each perform distinct, critical operations:

```
+-----------------------------------------------------------------------+
|                           PulsePoll Architecture                      |
+-----------------------------------------------------------------------+
|                                                                       |
|  [ React 18 Frontend ]  <====== (WebSocket) ======>  [ Go + Gin ]     |
|          |                                                |           |
|   (REST API Requests)                                     |           |
|          v                                                v           |
|  [ Go Gin API Handlers ]                      [ Redis In-Memory ]     |
|          |                                    (Live HINCRBY Hash)     |
|          v                                                |           |
|  [ MongoDB Persistent Data ] <----------------------------+           |
|     (Users, Polls, Audit Votes)                                       |
+-----------------------------------------------------------------------+
```

1. **React 18 (Frontend):** Modern UI, React Router v6, custom WebSocket subscription hooks, dynamic progress visualization, confetti effects, and QR code generation.
2. **Go + Gin (Backend):** High-throughput REST API, JWT authentication, Bcrypt password hashing, request context middleware, input validation, concurrency primitives, and WebSocket Hub routing.
3. **MongoDB (Database):** Persistent database storing user credentials, poll configurations, option metadata, and persistent audit vote records.
4. **Redis (Realtime Engine):** Atomic in-memory vote increments using `HINCRBY` on hash key `poll:{pollID}`, providing instant live vote retrieval.
5. **Gorilla WebSockets:** Dual-pump read/write connection channels pushing JSON state updates to room-grouped client goroutines.

---

## ⚡ Real-Time Logical Flow & Redis HINCRBY Engine

When a vote is cast, PulsePoll executes the following strict non-blocking pipeline:

```
Client A Submits Vote
        ↓
POST /api/polls/:id/vote
        ↓
Go Backend Validates Poll, Expiration, Option & Duplicate Token
        ↓
Execute Redis Atomic Command: HINCRBY poll:abc123 optionId 1
        ↓
Read Updated Vote Totals: HGETALL poll:abc123
        ↓
Persist Vote Record asynchronously to MongoDB
        ↓
Broadcast JSON to WebSocket Hub for poll "abc123"
        ↓
Client A, Client B, Client C, Client D Receive JSON Frame
        ↓
React State Updates UI Instantly (Zero Page Refresh)
```

---

## 💾 Database Consistency Strategy

To balance sub-second performance with data persistence, PulsePoll uses a dual Redis + MongoDB approach:

| Storage Layer | Data Responsibilities | Lifecycle / Recovery |
|---|---|---|
| **Redis** | Live vote counts per option (`poll:{pollID}` hash), temporary anti-duplicate voter keys (`voted:{pollID}:{voterID}`) | Updated atomically via `HINCRBY`. Read instantly during realtime broadcasts. |
| **MongoDB** | Users collection, Poll configurations, Options array, and individual `VoteRecord` entries | Persistent disk storage. Acts as the Single Source of Truth. |

**Redis Restart / Hydration Strategy:**  
When a poll is requested, if Redis live counts are empty (e.g. after a cache flush or Redis restart), the Go backend automatically reads the option counts from MongoDB persistent records and populates Redis via `HSET poll:{pollID}` before serving requests.

---

## 📁 Monorepo Directory Structure

```
live-polling-app/
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, Footer, ProtectedRoute, QRCodeModal
│   │   ├── context/          # AuthContext provider
│   │   ├── hooks/            # useAuth, useWebSocket hooks
│   │   ├── pages/            # Landing, Login, Signup, Dashboard, CreatePoll, PollView, NotFound
│   │   ├── services/         # API fetch, authService, pollService
│   │   ├── utils/            # Voter ID session fingerprinting
│   │   ├── App.jsx           # React Router route setup
│   │   ├── index.css         # Tailwind & Glassmorphism styles
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── cmd/server/main.go    # HTTP & WS server entrypoint
│   ├── config/               # Environment variables loader
│   ├── database/             # MongoDB driver & Redis HINCRBY client
│   ├── handlers/             # HTTP auth, poll & WebSocket handlers
│   ├── middleware/           # Auth JWT middleware & CORS handling
│   ├── models/               # Struct definitions (User, Poll, Vote, Response)
│   ├── repository/           # MongoDB user & poll repositories
│   ├── routes/               # Gin REST & WebSocket routes
│   ├── services/             # AuthService, PollService, VoteService
│   ├── utils/                # Bcrypt, JWT & server-side Validator
│   ├── websocket/            # Room-based WebSocket Hub & Client pumps
│   ├── go.mod
│   └── go.sum
├── .gitignore
├── README.md
└── .env.example
```

---

## 🔑 Environment Variables

### Backend (`live-polling-app/backend/.env`)

```env
PORT=8080
ENV=development
FRONTEND_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/pulsepoll
MONGO_DB_NAME=pulsepoll
REDIS_URL=redis://localhost:6379
JWT_SECRET=pulsepoll_jwt_super_secret_key_2026_change_in_production
JWT_EXPIRATION_HOURS=24
```

### Frontend (`live-polling-app/frontend/.env`)

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

---

## 💻 Local Installation & Development Guide

### Prerequisites
- Node.js (v18+)
- Go (v1.20+)
- MongoDB (Local or Atlas URI)
- Redis (Local or Cloud Redis URL)

### 1. Start the Go Backend Server
```bash
cd live-polling-app/backend
go mod tidy
go run ./cmd/server
```
*Server starts on `http://localhost:8080`.*

### 2. Start the React Frontend Application
```bash
cd live-polling-app/frontend
npm install
npm run dev
```
*App runs on `http://localhost:5173`.*

---

## 📑 REST API Documentation

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | No | Register a new user account (returns JWT token) |
| `POST` | `/api/auth/login` | No | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Yes (`Bearer`) | Fetch authenticated user profile |
| `POST` | `/api/polls` | Yes (`Bearer`) | Create a new live poll with options and expiration |
| `GET` | `/api/polls/:id` | No | Fetch poll question, options, and live vote counts |
| `GET` | `/api/polls/:id/results` | No | Fetch aggregated poll results & percentage data |
| `POST` | `/api/polls/:id/vote` | No | Submit a vote for an option (`optionId`) |
| `GET` | `/api/my-polls` | Yes (`Bearer`) | Get all polls created by logged-in user |

### Request Example (`POST /api/polls`):
```json
{
  "question": "What is your favorite programming language?",
  "options": ["Python", "Java", "JavaScript", "Go"],
  "expirationMinutes": 60
}
```

---

## 📡 WebSocket API Specification

- **Endpoint:** `ws://localhost:8080/ws/polls/:pollId`
- **Protocol:** WebSockets (`ws://` for dev, `wss://` for production)
- **Broadcast Payload (`poll_update`):**
```json
{
  "type": "poll_update",
  "pollId": "66e7f2b1a8c9e01234567890",
  "results": [
    { "optionId": "opt1", "text": "Python", "votes": 12, "percentage": 48.0 },
    { "optionId": "opt2", "text": "Go", "votes": 13, "percentage": 52.0 }
  ],
  "totalVotes": 25
}
```

---

## 🔒 Security & Validation Features

1. **Bcrypt Password Security:** Passwords hashed with salt cost 10 before storage. Plaintext passwords are never saved.
2. **JWT Authorization Middleware:** Protected endpoints require `Authorization: Bearer <token>` containing signed User ID and expiration claims.
3. **Double Backend Validation:** Both frontend and Go backend enforce question length limits (5-300 chars), option limits (2-10 options), non-empty trim logic, and case-insensitive duplicate option detection.
4. **Option ID Verification:** Backend checks selected `optionId` against poll metadata stored in MongoDB to prevent forged client options.
5. **CORS Headers:** Explicit origins allowed via configuration instead of wildcards in production.

---

## 🌐 Deployment Instructions

### Deploying Backend (Render / Railway / Fly.io)
1. Push project repository to GitHub.
2. Create a Go Web Service on Render or Railway pointing to `./live-polling-app/backend`.
3. Set Build Command: `go build -o server ./cmd/server`
4. Set Start Command: `./server`
5. Configure Environment Variables: `MONGO_URI`, `REDIS_URL`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`.

### Deploying Frontend (Vercel / Netlify / Render)
1. Create a Static Site on Vercel/Netlify pointing to `./live-polling-app/frontend`.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Set Environment Variables:
   - `VITE_API_URL=https://your-backend.onrender.com/api`
   - `VITE_WS_URL=wss://your-backend.onrender.com/ws`

---

## 🤖 AI Tooling & Development Disclosure

In accordance with internship submission guidelines:
- **AI Coding Assistance:** Google DeepMind AI agentic coding tool (*Antigravity*) was utilized during development for architecture design review, code generation, error checking, and technical documentation drafting.
- All code was compiled, verified, and tested end-to-end for real functional behavior without stubbed logic or fake updates.
