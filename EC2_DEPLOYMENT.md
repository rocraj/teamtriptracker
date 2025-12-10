# EC2 Production Deployment Guide

## Quick Deployment Steps

### 1. Commit and Push Changes
```bash
git add .
git commit -m "Production ready: Updated CORS and added deployment scripts"
git push origin main
```

### 2. Deploy to EC2 (Automatic)
```bash
./deploy-ec2.sh
```

### 3. Manual Deployment (if automatic fails)

#### SSH to EC2:
```bash
ssh ubuntu@65.1.94.243
```

#### On EC2, run these commands:
```bash
# Clone/update repository
cd /home/ubuntu
git clone https://github.com/rocraj/teamtriptracker.git || (cd teamtriptracker && git pull)
cd teamtriptracker/backend

# Setup Python environment
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create production environment
cat > .env << EOF
DATABASE_URL=sqlite:///./teamsplit_production.db
JWT_SECRET=$(openssl rand -hex 32)
FRONTEND_URL=https://teamsplit.psynik.com
BACKEND_URL=https://teamsplit-api.psynik.com
EOF

# Initialize database
python -c "from app.core.database import create_db_and_tables; create_db_and_tables()"

# Start the service
./start_backend.sh start
```

## Service Management

### Check Status
```bash
ssh ubuntu@65.1.94.243 'cd teamtriptracker/backend && ./start_backend.sh status'
```

### View Logs
```bash
ssh ubuntu@65.1.94.243 'cd teamtriptracker/backend && ./start_backend.sh logs'
```

### Restart Service
```bash
ssh ubuntu@65.1.94.243 'cd teamtriptracker/backend && ./start_backend.sh restart'
```

## URLs After Deployment
- **Frontend**: https://teamsplit.psynik.com
- **Backend API**: https://teamsplit-api.psynik.com
- **API Documentation**: https://teamsplit-api.psynik.com/docs

## CORS Configuration Fixed
The backend now accepts requests from:
- http://localhost:4200 (development)
- https://teamtriptracker.web.app (Firebase default)
- https://teamsplit.psynik.com (custom domain)
- https://teamsplit-api.psynik.com (API domain)