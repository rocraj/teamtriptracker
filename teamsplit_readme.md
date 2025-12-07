# TeamSplit — Group Expense & Budget Sharing App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![Angular](https://img.shields.io/badge/Angular-17+-red.svg)](https://angular.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

A transparent, real-time expense-splitting application for teams and travel groups. TeamSplit provides intelligent expense tracking, automated settlement calculations, and fair payment distribution across group members.

## 🌟 Features

- **Flexible Expense Splitting**: Split expenses across all members or select specific participants
- **Smart Settlement Engine**: Optimal "who-owes-who" calculations with minimal transactions
- **Dual Authentication**: Google OAuth2 and magic link email authentication
- **Budget Tracking**: Individual and team-level budget monitoring
- **Fair Payment Suggestions**: AI-powered recommendations for next payer
- **Real-time Updates**: Live expense tracking and balance calculations
- **Secure & Auditable**: Backend-verified calculations prevent client-side manipulation

## 🏗️ Architecture

```
teamsplit/
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── api/     # API endpoints
│   │   ├── core/    # Configuration & security
│   │   ├── models/  # Database models
│   │   ├── services/# Business logic
│   │   └── utils/   # Helper functions
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
└── frontend/         # Angular + TailwindCSS frontend
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   ├── services/
    │   │   ├── guards/
    │   │   └── models/
    │   ├── assets/
    │   └── environments/
    ├── angular.json
    ├── tailwind.config.js
    └── package.json
```

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+ (Aiven)
- **ORM**: SQLModel / SQLAlchemy
- **Authentication**: JWT + Google OAuth2
- **Email**: Gmail SMTP
- **Deployment**: Cloud Run / Render

### Frontend
- **Framework**: Angular 17
- **Styling**: TailwindCSS
- **State Management**: RxJS
- **HTTP Client**: Angular HttpClient
- **Deployment**: Firebase Hosting

## 📋 Prerequisites

- **Node.js**: v18+ and npm
- **Python**: 3.11+
- **PostgreSQL**: 15+ (or Aiven account)
- **Google Cloud Console**: OAuth2 credentials
- **Gmail**: SMTP credentials for magic links

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/teamsplit.git
cd teamsplit
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

**Configure `.env`:**

```env
DATABASE_URL=postgresql://user:password@host:port/expense_app
JWT_SECRET=your-super-secret-jwt-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:8000
```

**Run database migrations:**

```bash
alembic upgrade head
```

**Start the backend server:**

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`  
API documentation at `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp src/environments/environment.example.ts src/environments/environment.ts
```

**Configure `environment.ts`:**

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  googleClientId: 'your-google-client-id'
};
```

**Start the development server:**

```bash
ng serve
```

Frontend will be available at `http://localhost:4200`

## 📡 API Endpoints

### Authentication
```
POST   /auth/google-signin          # Google OAuth login
POST   /auth/email/request-link     # Send magic link
GET    /auth/email/verify           # Verify magic link token
GET    /auth/me                     # Get current user
```

### Teams
```
POST   /teams                       # Create new team
GET    /teams                       # List user's teams
GET    /teams/{team_id}             # Get team details
POST   /teams/{team_id}/invite      # Invite member
POST   /teams/{team_id}/budget      # Set member budgets
```

### Expenses
```
POST   /expenses                    # Create expense
GET    /expenses/{team_id}          # List team expenses
GET    /expenses/{team_id}/{id}     # Get expense details
DELETE /expenses/{id}               # Delete expense
```

### Summary & Analytics
```
GET    /summary/{team_id}/balances      # Net balances per user
GET    /summary/{team_id}/settlements   # Optimal settlement plan
GET    /summary/{team_id}/next-payer    # Fair payment suggestion
```

## 💾 Database Schema

### Core Models

**User**
- `id` (UUID, PK)
- `email` (String, Unique)
- `name` (String)
- `photo_url` (String)
- `auth_provider` (Enum: google/email)
- `hashed_password` (String, Nullable)
- `created_at` (Timestamp)

**Team**
- `id` (UUID, PK)
- `name` (String)
- `created_by` (UUID, FK → User)
- `created_at` (Timestamp)

**TeamMember**
- `id` (UUID, PK)
- `team_id` (UUID, FK → Team)
- `user_id` (UUID, FK → User)
- `initial_budget` (Float)

**Expense**
- `id` (UUID, PK)
- `team_id` (UUID, FK → Team)
- `payer_id` (UUID, FK → User)
- `total_amount` (Float)
- `participants` (JSON Array of UUIDs)
- `type_label` (String)
- `type_emoji` (String)
- `note` (Text)
- `created_at` (Timestamp)

## 🧮 Settlement Algorithm

TeamSplit uses a **greedy minimal cash flow algorithm** to optimize settlements:

1. Calculate net balance for each user:
   ```
   balance[user] = total_paid - total_share
   ```

2. Sort users into creditors (positive balance) and debtors (negative balance)

3. Match largest debtor with largest creditor until balanced

**Example:**
- Alice: +$300 (owed)
- Bob: -$200 (owes)
- Charlie: -$100 (owes)

**Settlement:**
- Bob pays Alice $200
- Charlie pays Alice $100

**Result:** 2 transactions instead of potential 6

## 🎨 Frontend Pages

1. **Login/Signup** — Google OAuth + Magic link authentication
2. **Dashboard** — Budget overview, recent expenses, quick actions
3. **Teams** — Create/manage teams, invite members
4. **Add Expense** — Smart form with participant selection
5. **Team Summary** — Expense history, balances, settlement plan
6. **Settings** — Profile, notifications, team management

## 🔒 Security Features

- ✅ JWT authentication with expiration
- ✅ HTTPS-only in production
- ✅ Backend calculation verification
- ✅ Database firewall restrictions
- ✅ Rate limiting on auth endpoints
- ✅ SQL injection prevention via ORM
- ✅ CORS configuration
- ✅ Input validation & sanitization

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v --cov=app
```

### Frontend Tests

```bash
cd frontend
npm run test              # Unit tests
npm run test:coverage    # With coverage
npm run e2e              # E2E tests
```

## 📦 Deployment

### Backend (AWS EC2 Ubuntu)

#### 1. Launch EC2 Instance

```bash
# Launch Ubuntu 22.04 LTS instance
# Instance type: t2.micro or t3.micro (free tier eligible)
# Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
```

#### 2. Connect and Setup Server

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11
sudo apt install python3.11 python3.11-venv python3-pip -y

# Install Nginx
sudo apt install nginx -y

# Install SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y
```

#### 3. Deploy Backend Application

```bash
# Clone repository
git clone https://github.com/yourusername/teamsplit.git
cd teamsplit/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with production settings
nano .env
```

#### 4. Setup Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/teamsplit.service
```

**Service file content:**

```ini
[Unit]
Description=TeamSplit FastAPI Application
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/teamsplit/backend
Environment="PATH=/home/ubuntu/teamsplit/backend/venv/bin"
ExecStart=/home/ubuntu/teamsplit/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable teamsplit
sudo systemctl start teamsplit
sudo systemctl status teamsplit
```

#### 5. Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/teamsplit
```

**Nginx configuration:**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/teamsplit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL
sudo certbot --nginx -d api.yourdomain.com
```

### Frontend (Firebase Hosting)

#### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### 2. Initialize Firebase Project

```bash
cd frontend

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting
```

**Configuration:**
- Public directory: `dist/teamsplit/browser`
- Single-page app: Yes
- Automatic builds: No

#### 3. Update Environment for Production

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com',
  googleClientId: 'your-production-google-client-id'
};
```

#### 4. Build and Deploy

```bash
# Build for production
ng build --configuration production

# Deploy to Firebase
firebase deploy --only hosting
```

### Database (Aiven PostgreSQL)

#### 1. Create Free PostgreSQL Instance

1. Sign up at [Aiven](https://aiven.io)
2. Create new PostgreSQL service (Free tier: 1GB storage)
3. Select cloud provider and region closest to your EC2 instance
4. Enable SSL enforcement

#### 2. Configure Database

```bash
# Get connection details from Aiven console
# Format: postgres://user:password@host:port/defaultdb?sslmode=require

# Connect to database
psql 'postgres://user:password@host:port/defaultdb?sslmode=require'

# Create application database
CREATE DATABASE expense_app;
```

#### 3. Whitelist EC2 IP

1. In Aiven console, go to your PostgreSQL service
2. Navigate to "Overview" → "Allowed IP addresses"
3. Add your EC2 instance public IP address
4. Save changes

#### 4. Update Backend Environment

```bash
# On EC2 instance, update .env file
nano /home/ubuntu/teamsplit/backend/.env
```

```env
DATABASE_URL=postgresql://user:password@host:port/expense_app?sslmode=require
```

```bash
# Restart backend service
sudo systemctl restart teamsplit
```

### CI/CD Pipeline (Optional)

#### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd teamsplit
            git pull origin main
            cd backend
            source venv/bin/activate
            pip install -r requirements.txt
            sudo systemctl restart teamsplit

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install and Build
        run: |
          cd frontend
          npm ci
          ng build --configuration production
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-firebase-project-id
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Python**: Follow PEP 8, use `black` formatter
- **TypeScript**: Follow Angular style guide, use `prettier`
- **Commits**: Use conventional commits format

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- FastAPI for the excellent Python framework
- Angular team for the robust frontend framework
- TailwindCSS for beautiful styling utilities
- Aiven for reliable PostgreSQL hosting

## 📧 Support

For support, email support@teamsplit.com or open an issue on GitHub.

## 🗺️ Roadmap

### ✅ Phase 1: Core Infrastructure (Current)
- [x] AWS EC2 Ubuntu backend deployment
- [x] Firebase Hosting frontend deployment
- [x] Aiven PostgreSQL free tier integration
- [x] SSL/HTTPS setup with Let's Encrypt
- [x] Nginx reverse proxy configuration
- [x] Systemd service management
- [x] Basic CI/CD with GitHub Actions

### 🚀 Phase 2: Enhanced Features (Q2 2025)
- [ ] **Receipt Management**: Photo uploads with OCR text extraction
- [ ] **Multi-Currency Support**: Real-time exchange rate conversion
- [ ] **Recurring Expenses**: Automated monthly/weekly expense entries
- [ ] **Expense Categories**: Custom categories with budget limits
- [ ] **Advanced Analytics**: Spending trends, charts, and insights
- [ ] **Export Functionality**: Generate PDF reports and CSV exports

### 📱 Phase 3: Mobile & Notifications (Q3 2025)
- [ ] **Progressive Web App (PWA)**: Offline-capable mobile experience
- [ ] **Push Notifications**: Expense alerts and payment reminders
- [ ] **Native Mobile App**: React Native iOS/Android applications
- [ ] **Real-time Sync**: WebSocket integration for live updates
- [ ] **Mobile Receipt Scanning**: Camera integration for instant uploads

### 🔧 Phase 4: Advanced Integrations (Q4 2025)
- [ ] **Payment Gateway Integration**: Stripe/PayPal for in-app settlements
- [ ] **Bank Account Linking**: Plaid integration for automatic expense import
- [ ] **Calendar Integration**: Google Calendar expense scheduling
- [ ] **Slack/Discord Bots**: Team notifications and quick commands
- [ ] **API Webhooks**: Third-party integration capabilities

### 🌐 Phase 5: Scale & Performance (2026)
- [ ] **AWS Auto Scaling**: Load balancer with multiple EC2 instances
- [ ] **Redis Caching**: Improved response times and reduced DB load
- [ ] **CloudFront CDN**: Global content delivery for frontend
- [ ] **RDS Migration**: Upgrade from Aiven to AWS RDS PostgreSQL
- [ ] **ElasticSearch**: Advanced search and filtering capabilities
- [ ] **Monitoring Stack**: Prometheus + Grafana dashboards

### 🎨 Phase 6: User Experience (2026)
- [ ] **Dark Mode**: Complete dark theme support
- [ ] **Multi-language Support**: i18n for global users
- [ ] **Accessibility**: WCAG 2.1 AA compliance
- [ ] **Custom Themes**: User-defined color schemes
- [ ] **Keyboard Shortcuts**: Power user navigation
- [ ] **Voice Commands**: Voice-activated expense entry

### 🔐 Phase 7: Enterprise Features (2027)
- [ ] **Team Roles & Permissions**: Admin, member, viewer hierarchies
- [ ] **Audit Logs**: Complete expense history tracking
- [ ] **SSO Integration**: SAML/OAuth enterprise authentication
- [ ] **Advanced Reporting**: Custom report builder
- [ ] **White-label Solution**: Brandable for organizations
- [ ] **API Rate Limiting**: Tiered access plans

### Infrastructure Evolution

**Current Stack:**
```
Frontend: Firebase Hosting (Free)
Backend: AWS EC2 t2.micro (Free tier)
Database: Aiven PostgreSQL (Free 1GB)
SSL: Let's Encrypt (Free)
```

**Target Production Stack (Phase 5):**
```
Frontend: Firebase Hosting + CloudFront CDN
Backend: AWS EC2 Auto Scaling Group (t3.medium x 2)
Database: AWS RDS PostgreSQL (Multi-AZ)
Cache: AWS ElastiCache Redis
Load Balancer: AWS Application Load Balancer
Monitoring: CloudWatch + Prometheus + Grafana
```

### Performance Targets
- API Response Time: < 200ms (p95)
- Frontend Load Time: < 2s (First Contentful Paint)
- Database Query Time: < 50ms (p95)
- Uptime: 99.9% SLA
- Concurrent Users: Support 10,000+ simultaneous users

---

**Made with ❤️ by the TeamSplit Team**