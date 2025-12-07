# TeamSplit - Getting Started Guide

A complete guide to setting up and running the TeamSplit application locally.

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** 15+ (or use SQLite for development)
- **Git**

## Project Structure

```
teamtriptracker/
├── backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── api/            # API endpoint routers
│   │   ├── core/           # Configuration & security
│   │   ├── models/         # SQLModel database schemas
│   │   ├── services/       # Business logic services
│   │   └── main.py         # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── .env               # Environment variables
│   └── Dockerfile         # Docker configuration
│
└── frontend/              # Angular 17 + TailwindCSS frontend
    ├── src/
    │   ├── app/
    │   │   ├── pages/     # Full page components (routed)
    │   │   ├── components/ # Reusable UI components
    │   │   ├── services/  # API client services
    │   │   ├── guards/    # Route guards
    │   │   ├── models/    # TypeScript interfaces
    │   │   └── utils/     # Helper functions
    │   ├── environments/  # Environment configurations
    │   └── styles.css     # Global styles
    ├── package.json
    ├── angular.json
    ├── tailwind.config.js
    └── tsconfig.json
```

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

The `.env` file is already created. Update with your settings:

```bash
# Database (use SQLite for quick testing)
DATABASE_URL=sqlite:///./teamsplit.db

# Or PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/teamsplit_dev

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# OAuth (optional, leave blank for now)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email (optional, leave blank for now)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# URLs
FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:8000
```

### 5. Initialize Database

```bash
# For SQLite, the database is created automatically
# For PostgreSQL, create the database first:
# createdb teamsplit_dev

# Tables are created on first startup
```

### 6. Start Backend Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**
API Docs: **http://localhost:8000/docs**

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

This may take 2-3 minutes.

### 3. Configure Environment

The environment files are already created. No changes needed for local development.

**Environment Configuration:**
- Development: `src/environments/environment.ts` (uses http://localhost:8000)
- Production: `src/environments/environment.prod.ts`

### 4. Start Development Server

```bash
npm start
# or
ng serve
```

Frontend will be available at: **http://localhost:4200**

## Running Both Applications

### Terminal 1 - Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

Both will run concurrently with hot reload enabled.

## Features Implemented

### Backend ✅
- ✅ User authentication (email/password, magic link support)
- ✅ Team management (create, list, invite members)
- ✅ Expense tracking (create, list, delete)
- ✅ Settlement algorithm (greedy minimal cash flow)
- ✅ Balance calculations
- ✅ Next payer suggestions
- ✅ API documentation (Swagger/OpenAPI)
- ✅ CORS configuration
- ✅ Database models (SQLModel/SQLAlchemy)

### Frontend ✅
- ✅ Mobile-first responsive design (TailwindCSS)
- ✅ Authentication pages (login, signup)
- ✅ Dashboard with quick actions
- ✅ Teams management page
- ✅ Team detail view with tabs
- ✅ Settings page
- ✅ Reusable components (buttons, inputs, cards, alerts)
- ✅ Service layer for API calls
- ✅ Route guards for protected pages
- ✅ Utility functions (formatting, validation)

## API Endpoints

### Authentication
```
POST   /auth/register              # Create new account
POST   /auth/login                 # Login with credentials
POST   /auth/google-signin         # Google OAuth login
POST   /auth/email/request-link    # Request magic link
GET    /auth/email/verify          # Verify magic link
GET    /auth/me                    # Get current user
```

### Teams
```
POST   /teams                      # Create team
GET    /teams                      # List user's teams
GET    /teams/{team_id}            # Get team details
GET    /teams/{team_id}/members    # Get team members
POST   /teams/{team_id}/invite     # Invite member
POST   /teams/{team_id}/budget     # Set member budget
```

### Expenses
```
POST   /expenses                   # Create expense
GET    /expenses/{team_id}         # List team expenses
GET    /expenses/{team_id}/{id}    # Get expense details
DELETE /expenses/{id}              # Delete expense
```

### Summary
```
GET    /summary/{team_id}/balances      # Get member balances
GET    /summary/{team_id}/settlements   # Get settlement plan
GET    /summary/{team_id}/next-payer    # Get next payer suggestion
```

## Frontend Routes

```
/                  → /dashboard
/login             # Login page
/signup            # Sign up page
/dashboard         # Dashboard (main page)
/teams             # Teams list page
/teams/:id         # Team detail page
/settings          # User settings
```

## Testing

### Test API Endpoints

Using curl or Postman:

```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"password123","auth_provider":"email"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Or use the interactive Swagger API docs:
**http://localhost:8000/docs**

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Change port
uvicorn app.main:app --reload --port 8001
```

**Module not found errors:**
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

**Database connection errors:**
```bash
# Check DATABASE_URL in .env
# For SQLite: DATABASE_URL=sqlite:///./teamsplit.db
# For PostgreSQL: ensure postgres is running
```

### Frontend Issues

**Port 4200 already in use:**
```bash
# Change port
ng serve --port 4201
```

**Dependencies not installed:**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

**CSS not working:**
```bash
# Rebuild Tailwind CSS
npm run build
```

## Next Steps

1. **Test the application** locally
2. **Add expenses** and verify calculations
3. **Invite team members** (add their emails)
4. **View settlements** to see who owes whom
5. **Deploy** to production (see README in backend/ and frontend/)

## Production Deployment

See specific deployment guides:
- Backend: [Backend Deployment Guide](./backend/README.md)
- Frontend: [Frontend Deployment Guide](./frontend/README.md)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Support

For issues or questions, please open an issue on GitHub.

## License

MIT License - See LICENSE file for details
