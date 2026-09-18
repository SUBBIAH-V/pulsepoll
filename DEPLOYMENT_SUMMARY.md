# 🚀 Complete Deployment Specifications & Master Guide for PulsePoll

This document contains all exact configurations, environment variables, build commands, and step-by-step procedures to host **PulsePoll** live on **Render** (Go Backend API) and **Vercel** (React Frontend).

---

## 📦 1. Repository Specifications

| Parameter | Specification |
| :--- | :--- |
| **GitHub Repository** | `https://github.com/SUBBIAH-V/pulsepoll` |
| **Branch** | `main` |
| **Backend Directory** | `/backend` |
| **Frontend Directory** | `/frontend` |

---

## 🟢 2. Cloud Database Setup (Prerequisites)

### **A. MongoDB Atlas (Database)**
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a **Free Tier (M0)** Cluster.
3. Under **Database Access**, create a user with read/write privileges.
4. Under **Network Access**, add IP `0.0.0.0/0` (Allows Cloud API access).
5. **Connection String Format**:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/pulsepoll?retryWrites=true&w=majority
   ```

### **B. Upstash Redis (Pub/Sub & Sub-second Cache)**
1. Sign up at [upstash.com](https://upstash.com).
2. Create a **Free Redis Database**.
3. Copy your **Redis Connection URL** under Database Details.
4. **Redis URL Format**:
   ```text
   rediss://default:<password>@<host>.upstash.io:6379
   ```

---

## ⚙️ 3. Backend Deployment Configuration (Render)

Render automatically detects `render.yaml` inside your GitHub repository.

### **Service Details**
* **Service Type**: Web Service (Docker)
* **Region**: Singapore (or nearest)
* **Dockerfile Path**: `./backend/Dockerfile`
* **Docker Context**: `./backend`
* **Port**: `8080`

### **Environment Variables for Render**

| Variable Key | Type | Example / Value | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Plain | `8080` | Internal server port |
| `ENV` | Plain | `production` | Execution environment |
| `MONGO_URI` | Secret | `mongodb+srv://user:pass@cluster.mongodb.net/pulsepoll...` | MongoDB connection string |
| `MONGO_DB_NAME` | Plain | `pulsepoll` | Database name |
| `REDIS_URL` | Secret | `rediss://default:pass@host.upstash.io:6379` | Upstash Redis connection string |
| `JWT_SECRET` | Secret | *(Random 32-char string)* | User auth session token secret |
| `FRONTEND_URL` | Secret | `https://pulsepoll.vercel.app` | Allowed CORS frontend origin |

* **Live Backend URL**: `https://pulsepoll-backend.onrender.com`

---

## ⚡ 4. Frontend Deployment Configuration (Vercel)

### **Project Setup**
1. Log into [vercel.com](https://vercel.com).
2. Click **Add New** → **Project** → Select `SUBBIAH-V/pulsepoll`.
3. Set **Root Directory** to `frontend`.
4. **Framework Preset**: `Vite`
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`

### **Environment Variables for Vercel**

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://pulsepoll-backend.onrender.com` | Live backend API URL for REST & WebSockets |

* **Live Frontend URL**: `https://pulsepoll.vercel.app` (or generated Vercel URL)

---

## 🔍 5. Verification & Health Check Procedure

1. **API Health Endpoint**: Open `https://pulsepoll-backend.onrender.com/health` in browser -> Should return `{"status": "ok"}`.
2. **WebSocket Realtime Verification**: Open live poll on two separate browser tabs/devices -> Votes and slide switches should update in `< 0.5s`.
3. **Poll Closed Modal Test**: Click **Stop Poll** in host view -> Audience tab immediately displays **"Poll Session Closed"** modal.
