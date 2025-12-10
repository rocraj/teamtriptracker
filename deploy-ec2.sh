#!/bin/bash

# TeamTripTracker EC2 Production Deployment Script
# This script deploys the application to EC2 instance

set -e  # Exit on any error

echo "🚀 TeamTripTracker EC2 Production Deployment"
echo "============================================="

# Configuration
EC2_HOST="${EC2_HOST:-ubuntu@65.1.94.243}"
REPO_URL="${REPO_URL:-git@github.com:rocraj/teamtriptracker.git}"
DEPLOY_PATH="/home/ubuntu/teamtriptracker"
SERVICE_NAME="teamtriptracker-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if SSH key is available
if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
    print_error "No SSH key found. Please set up SSH key authentication with EC2."
    echo "Run: ssh-keygen -t ed25519 -C 'your_email@example.com'"
    echo "Then add the public key to EC2: ssh-copy-id $EC2_HOST"
    exit 1
fi

# Test SSH connection
echo "🔐 Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $EC2_HOST echo "SSH connection successful" 2>/dev/null; then
    print_error "Cannot connect to EC2 instance: $EC2_HOST"
    echo "Please ensure:"
    echo "1. EC2 instance is running"
    echo "2. Security groups allow SSH (port 22)"
    echo "3. SSH key is properly configured"
    exit 1
fi
print_status "SSH connection established"

# Commit and push latest changes
echo ""
echo "📝 Committing and pushing latest changes..."
git add .
git commit -m "Production deployment: Updated CORS and deployment scripts" || print_warning "No changes to commit"
git push origin main
print_status "Code pushed to repository"

# Deploy to EC2
echo ""
echo "🌐 Deploying to EC2 instance..."

ssh $EC2_HOST << 'ENDSSH'
set -e

echo "📁 Setting up deployment directory..."
if [ ! -d "/home/ubuntu/teamtriptracker" ]; then
    git clone https://github.com/rocraj/teamtriptracker.git /home/ubuntu/teamtriptracker
else
    cd /home/ubuntu/teamtriptracker
    git pull origin main
fi

cd /home/ubuntu/teamtriptracker

echo "🐍 Setting up Python environment..."
# Install Python 3.11 if not available
if ! command -v python3.11 &> /dev/null; then
    sudo apt update
    sudo apt install -y software-properties-common
    sudo add-apt-repository -y ppa:deadsnakes/ppa
    sudo apt update
    sudo apt install -y python3.11 python3.11-venv python3.11-dev
fi

# Create virtual environment
if [ ! -d "backend/venv" ]; then
    cd backend
    python3.11 -m venv venv
    cd ..
fi

# Activate virtual environment and install dependencies
cd backend
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "⚙️ Setting up production environment..."
# Create production environment file
cat > .env << EOF
# Production Environment Configuration
DATABASE_URL=sqlite:///./teamsplit_production.db
JWT_SECRET=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# SMTP Configuration (add your settings)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Production URLs
FRONTEND_URL=https://teamsplit.psynik.com
BACKEND_URL=https://teamsplit-api.psynik.com

# CORS Origins
CORS_ORIGINS=["http://localhost:4200","https://teamtriptracker.web.app","https://teamsplit.psynik.com","https://teamsplit-api.psynik.com"]
EOF

echo "🗄️ Setting up database..."
python -c "
from app.core.database import create_db_and_tables
create_db_and_tables()
print('Database initialized successfully')
"

echo "📦 Setting up systemd service..."
sudo tee /etc/systemd/system/teamtriptracker-backend.service > /dev/null << 'EOSERVICE'
[Unit]
Description=TeamTripTracker Backend API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/teamtriptracker/backend
Environment=PATH=/home/ubuntu/teamtriptracker/backend/venv/bin
ExecStart=/home/ubuntu/teamtriptracker/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOSERVICE

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable teamtriptracker-backend
sudo systemctl restart teamtriptracker-backend

echo "🔥 Configuring Nginx reverse proxy..."
sudo apt install -y nginx

# Configure Nginx for the API
sudo tee /etc/nginx/sites-available/teamsplit-api << 'EONGINX'
server {
    listen 80;
    server_name teamsplit-api.psynik.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EONGINX

# Enable the site
sudo ln -sf /etc/nginx/sites-available/teamsplit-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo "🔒 Setting up SSL with Certbot..."
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d teamsplit-api.psynik.com --non-interactive --agree-tos --email admin@psynik.com || echo "SSL setup failed, but continuing..."

echo "✅ Deployment completed successfully!"
echo "🌐 Backend API: https://teamsplit-api.psynik.com"
echo "📊 Health check: https://teamsplit-api.psynik.com/docs"

# Check service status
sudo systemctl status teamtriptracker-backend --no-pager
ENDSSH

print_status "EC2 deployment completed successfully!"

echo ""
echo "🎉 Deployment Summary"
echo "===================="
echo "Frontend: https://teamsplit.psynik.com (Firebase)"
echo "Backend:  https://teamsplit-api.psynik.com (EC2)"
echo "API Docs: https://teamsplit-api.psynik.com/docs"
echo ""
echo "🔧 Management Commands:"
echo "SSH to EC2: ssh $EC2_HOST"
echo "Check logs: ssh $EC2_HOST 'sudo journalctl -u teamtriptracker-backend -f'"
echo "Restart service: ssh $EC2_HOST 'sudo systemctl restart teamtriptracker-backend'"