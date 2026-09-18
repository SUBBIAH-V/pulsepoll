# 🚀 PulsePoll Automated Deployment Guide

All deployment configurations have been automatically created and included directly in your workspace repository:

- 🐳 **`backend/Dockerfile`**: Multi-stage lightweight Go container
- 📋 **`render.yaml`**: Blueprint for zero-click Render deployment
- ⚡ **`frontend/vercel.json`**: SPA router config for Vercel deployment
- 🛠️ **`docker-compose.yml`**: Full-stack single command local/VPS container setup

---

## 🟢 Method 1: Deploy Free Cloud Services (Recommended)

### 1. Database & Cache Setup (Free)
1. **MongoDB Atlas**:
   - Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
   - Get connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/pulsepoll?retryWrites=true&w=majority`
2. **Upstash Redis**:
   - Create a free database at [upstash.com](https://upstash.com).
   - Get Redis URL: `rediss://default:<password>@<host>:<port>`

---

### 2. Backend Deployment (Render)
1. Push your repository to **GitHub**.
2. Go to **[dashboard.render.com](https://dashboard.render.com)**.
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository (Render will automatically detect `render.yaml`).
5. Provide your `MONGO_URI` and `REDIS_URL`.
6. Click **Apply**. Your Go API will be live at: `https://pulsepoll-backend.onrender.com`.

---

### 3. Frontend Deployment (Vercel)
1. Go to **[vercel.com](https://vercel.com)**.
2. Click **Add New** → **Project**.
3. Import your GitHub repository and set **Root Directory** to `frontend`.
4. Add Environment Variable:
   - `VITE_API_URL` = `https://pulsepoll-backend.onrender.com`
5. Click **Deploy**.

---

## 🐳 Method 2: Deploy Anywhere via Docker (Local or VPS Server)

To run the full stack (MongoDB + Redis + Go API) locally or on a VPS like DigitalOcean / Hetzner with 1 single command:

```bash
docker compose up -d --build
```

Your app will be running instantly at:
- **API Backend**: `http://localhost:8080`
- **MongoDB**: `localhost:27017`
- **Redis**: `localhost:6379`
