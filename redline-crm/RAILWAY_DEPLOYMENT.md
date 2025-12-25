# Railway Deployment Guide - RedLine CRM

## ✅ Created Files

### Backend (`/backend/`)
- **railway.json** - Railway build & deploy configuration
- **Procfile** - Heroku-style process file

### Frontend (`/frontend/`)
- **railway.json** - Railway build & deploy configuration  
- **Procfile** - Heroku-style process file
- **package.json** - Updated with `start` script and `serve` dependency

---

## 🚂 Railway Deployment Steps

### Step 1: GitHub Pe Push Karein
```bash
cd "c:\Users\DELL\Downloads\redline-crm (2)\redline-crm"
git init
git add .
git commit -m "Add Railway deployment config"
git remote add origin https://github.com/YOUR_USERNAME/redline-crm.git
git push -u origin main
```

### Step 2: Railway Pe Login
1. [railway.app](https://railway.app) pe jayen
2. GitHub se sign up/login karein

### Step 3: New Project Banayein
1. **"New Project"** click karein
2. **"Deploy from GitHub repo"** select karein

### Step 4: MongoDB Database Add Karein
1. Project mein **"+ New"** → **"Database"** → **"Add MongoDB"**
2. MongoDB connect hone ke baad **Variables** tab mein `MONGODB_URL` copy karein

### Step 5: Backend Service Deploy Karein
1. **"+ New"** → **"GitHub Repo"** → Apna repo select karein
2. **Settings** tab mein:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. **Variables** tab mein add karein:

| Variable | Value |
|----------|-------|
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `MONGODB_URL` | *(MongoDB service se)* |
| `FRONTEND_URL` | *(baad mein update)* |
| `JWT_SECRET` | *(strong random string)* |
| `TWILIO_ACCOUNT_SID` | *(your value)* |
| `TWILIO_AUTH_TOKEN` | *(your value)* |
| `TWILIO_API_KEY` | *(your value)* |
| `TWILIO_API_SECRET` | *(your value)* |
| `TWILIO_TWIML_APP_SID` | *(your value)* |
| `GEMINI_API_KEY` | *(your value)* |

4. Deploy button press karein

### Step 6: Frontend Service Deploy Karein
1. **"+ New"** → **"GitHub Repo"** → Same repo select karein
2. **Settings** tab mein:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. **Variables** tab mein:

| Variable | Value |
|----------|-------|
| `VITE_APP_URL` | Backend ka Railway URL |
| `GEMINI_API_KEY` | *(your value)* |

4. Deploy button press karein

### Step 7: URLs Update Karein
1. Dono services pe **Settings** → **Networking** → **Generate Domain** enable karein
2. Backend ki `FRONTEND_URL` variable mein Frontend URL daalein
3. Twilio Dashboard mein webhooks update karein backend URL ke saath

---

## 🔗 Important URLs After Deployment
- **Frontend**: `https://redline-crm-frontend-production.up.railway.app`
- **Backend**: `https://redline-crm-backend-production.up.railway.app`
- **API**: `https://redline-crm-backend-production.up.railway.app/api`

---

## ⚠️ Twilio Webhook URLs Update Karein
Twilio Dashboard mein jaake in URLs update karein:
- Voice URL: `https://YOUR_BACKEND_URL/api/twilio/voice`
- Status Callback: `https://YOUR_BACKEND_URL/api/twilio/status`
