# TeamTripTracker - Full Stack Application

A complete expense tracking and settlement application for group trips built with Angular (frontend) and FastAPI (backend).

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Frontend Setup](#frontend-setup)
- [Backend Setup](#backend-setup)
- [Documentation](#documentation)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 15+ (or SQLite for development)

### Clone & Setup

```bash
# Clone repository
git clone https://github.com/rocraj/teamtriptracker.git
cd teamtriptracker

# Frontend Setup
cd frontend
npm install
npm start
# Frontend runs on http://localhost:4200
# Access from other WiFi devices: http://<your-local-ip>:4200

# Backend Setup (in new terminal)
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Update .env with your configuration
uvicorn app.main:app --reload --port 8000
# Backend runs on http://localhost:8000
```

### Network Access

The frontend is configured to be accessible from other devices on the same WiFi:

```bash
# Find your local IP:
ipconfig getifaddr en0  # macOS/Linux

# Access from another device:
http://<your-local-ip>:4200
```

Available npm scripts:
- `npm start` - Start dev server (network accessible, default)
- `npm run start:localhost` - Start dev server (localhost only)
- `npm run start:network` - Start with polling (for unstable WiFi)

## 📁 Project Structure

```
teamtriptracker/
├── frontend/                   # Angular 17 Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/         # Full page components
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── services/      # API client services
│   │   │   └── models/        # TypeScript interfaces
│   │   ├── environments/      # Environment configs
│   │   └── styles.css         # Global styles
│   ├── package.json           # Dependencies
│   ├── angular.json           # Angular config
│   ├── tailwind.config.js     # TailwindCSS config
│   ├── .env.example           # Environment template
│   ├── .gitignore             # Frontend git ignore
│   └── README.md              # Frontend guide
│
├── backend/                    # FastAPI Python Application
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   ├── core/              # Config & security
│   │   ├── models/            # Database schemas
│   │   ├── services/          # Business logic
│   │   └── main.py            # FastAPI app
│   ├── tests/                 # Test suite
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Environment template
│   ├── .gitignore             # Backend git ignore
│   ├── Dockerfile             # Docker config
│   └── README.md              # Backend guide
│
├── .gitignore                 # Root git ignore
└── README.md                  # This file
```

## 🎨 Frontend Setup

### Requirements
- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development Server

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`

### Build

```bash
npm run build
# or
ng build --prod
```

### Technologies
- **Framework:** Angular 17
- **Styling:** TailwindCSS
- **HTTP Client:** Axios
- **State Management:** RxJS BehaviorSubjects

### Environment Configuration

1. Copy `.env.example` to `.env.local`
2. Update API URL if needed:

```env
ANGULAR_APP_API_URL=http://localhost:8000
```

## 🔧 Backend Setup

### Requirements
- Python 3.11+
- PostgreSQL 15+ (or SQLite for development)

### Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Environment Configuration

1. Copy `.env.example` to `.env`
2. Update configuration:

```env
# Database (development with SQLite)
DATABASE_URL=sqlite:///./teamsplit.db

# Or PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/teamsplit_dev

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION_MINUTES=1440

# URLs
FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:8000
```

### Run Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

API documentation available at `http://localhost:8000/docs`

### Run Tests

```bash
pytest
```

### Technologies
- **Framework:** FastAPI
- **Database ORM:** SQLModel
- **Authentication:** JWT + Argon2
- **Email:** Google SMTP
- **API Format:** REST

## 📚 Documentation

- [Getting Started Guide](./GETTING_STARTED.md)
- [API Documentation](./backend/API_DOCUMENTATION.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Project Manifest](./PROJECT_MANIFEST.md)
- [Quick Reference](./QUICK_REFERENCE.md)
- [Frontend Development Guide](./frontend/DEVELOPMENT_GUIDE.md)
- [Backend Development Guide](./backend/DEVELOPMENT.md)

## 🎯 Features

### Core Features
- ✅ User Authentication (Email/Password & Google OAuth)
- ✅ Team Management with invitations
- ✅ Expense Tracking with multiple participants
- ✅ Automatic Settlement Calculation
- ✅ Budget Management per team member
- ✅ Full API Documentation

### Security
- JWT token-based authentication
- Argon2 password hashing
- CORS protection
- Email validation
- Team membership authorization

## 🔄 Workflow

1. **Register/Login** - Create account or login with email/Google
2. **Create Team** - Start a new team for trip expenses
3. **Invite Members** - Invite friends via email
4. **Track Expenses** - Log shared expenses with participants
5. **View Settlement** - See who owes whom and settle up

## 📞 Support

For issues or questions, please open an issue on GitHub.

## 📄 License

This project is open source and available under the MIT License.

---

**Happy tracking! 🎉**
