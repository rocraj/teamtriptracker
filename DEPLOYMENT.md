# 🚀 Deployment Guide

## Frontend Deployment (Firebase)

### Setup Firebase (One-time)
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (if not done)
cd frontend
firebase init hosting
```

### Deploy Frontend
```bash
cd frontend
./deploy.sh
```

**Frontend URL**: https://teamsplit.psynik.com

---

## Backend Deployment (Server Daemon)

### 1. Setup Backend on Server
```bash
# On your server (65.1.94.243)
git clone <your-repo>
cd teamtriptracker/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your production settings
```

### 2. Start Backend Daemon
```bash
cd backend
./start_backend.sh start
```

### 3. Backend Daemon Commands
```bash
# Start the daemon
./start_backend.sh start

# Check status
./start_backend.sh status

# View live logs
./start_backend.sh logs

# Stop the daemon
./start_backend.sh stop

# Restart the daemon
./start_backend.sh restart
```

**Backend API**: http://65.1.94.243:8000
**API Docs**: http://65.1.94.243:8000/docs

---

## Complete Deployment Workflow

### 1. Deploy Backend First
```bash
# On your server
cd teamtriptracker/backend
git pull origin main
./start_backend.sh restart
```

### 2. Deploy Frontend
```bash
# On your local machine
cd teamtriptracker/frontend
./deploy.sh
```

### 3. Verify Deployment
- ✅ Frontend: https://teamsplit.psynik.com
- ✅ Backend: http://65.1.94.243:8000/docs
- ✅ Test login and team creation

---

## Environment Configuration

### Production Environment Variables
Backend `.env`:
```env
DATABASE_URL=sqlite:///teamsplit.db
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
```

Frontend `environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'http://65.1.94.243:8000'
};
```

---

## Monitoring & Maintenance

### Check Backend Status
```bash
./start_backend.sh status
```

### View Logs
```bash
# Live logs
./start_backend.sh logs

# Static log files
tail -f /tmp/teamtriptracker-backend.log
tail -f /tmp/teamtriptracker-backend.error.log
```

### Update Deployment
```bash
# Backend
git pull && ./start_backend.sh restart

# Frontend
cd frontend && ./deploy.sh
```

---

## Troubleshooting

### Backend Issues
- Check logs: `./start_backend.sh logs`
- Verify port 8000 is open
- Check virtual environment: `source venv/bin/activate`

### Frontend Issues
- Rebuild: `npm run build --prod`
- Check Firebase project: `firebase projects:list`
- Verify environment.prod.ts API URL

### CORS Issues
- Ensure backend allows frontend domain
- Check browser network tab for blocked requests