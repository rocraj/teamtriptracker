# TeamSplit - Quick Reference

## 🚀 Quick Start (5 minutes)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
→ http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm start
```
→ http://localhost:4200

---

## 📁 Key Files

### Backend
- `app/main.py` - FastAPI app
- `app/api/*.py` - Endpoints
- `app/services/*.py` - Business logic
- `app/models/schemas.py` - Database models
- `.env` - Configuration
- `requirements.txt` - Dependencies

### Frontend
- `src/app/pages/` - Full pages
- `src/app/components/` - Reusable UI
- `src/app/services/` - API clients
- `src/app/utils/` - Helpers
- `package.json` - Dependencies
- `angular.json` - Build config

---

## 🔗 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /auth/register | Create account |
| POST | /auth/login | Login |
| POST | /teams | Create team |
| GET | /teams | List teams |
| POST | /expenses | Add expense |
| GET | /expenses/{team_id} | List expenses |
| GET | /summary/{team_id}/settlements | Get who owes who |

**Full Docs:** http://localhost:8000/docs

---

## 🛣️ Frontend Routes

| Route | Page | Protected |
|-------|------|-----------|
| /login | Login | ❌ |
| /signup | Sign up | ❌ |
| /dashboard | Dashboard | ✅ |
| /teams | Teams list | ✅ |
| /teams/:id | Team detail | ✅ |
| /settings | Settings | ✅ |

---

## 🔧 Configuration

### Backend (.env)
```
DATABASE_URL=sqlite:///./teamsplit.db
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:4200
```

### Frontend (environment.ts)
```typescript
apiUrl: 'http://localhost:8000'
```

---

## 🧮 Settlement Algorithm

```
Calculate balance per user:
  balance = total_paid - total_share

Match largest debtor with largest creditor:
  while debtors && creditors:
    amount = min(debtor_amount, creditor_amount)
    settle(debtor → creditor, amount)
```

**Result:** Minimum number of transactions needed

---

## 📊 Database Schema

```
User ────┐
         ├─── TeamMember ───── Team
         │                      
         └─── Expense ──────────┘
```

**Key Models:**
- `User` - Email, name, auth provider
- `Team` - Name, creator
- `TeamMember` - Links user to team + budget
- `Expense` - Amount, payer, participants

---

## 🎨 Component Tree

```
AppComponent
├── HeaderComponent
└── RouterOutlet
    ├── LoginPageComponent
    ├── SignupPageComponent
    ├── DashboardPageComponent
    │   ├── TeamCardComponent
    │   └── ExpenseCardComponent
    ├── TeamsPageComponent
    │   ├── InputFieldComponent
    │   └── TeamCardComponent
    ├── TeamDetailPageComponent
    │   ├── ExpenseCardComponent
    │   └── (Balances/Settlements)
    └── SettingsPageComponent
```

---

## 🔐 Auth Flow

```
1. User → Login Page
2. Submit credentials → POST /auth/login
3. Server returns JWT
4. Store in localStorage
5. Include in header: Authorization: Bearer {token}
6. AuthGuard checks token before routing
7. On logout → Remove token → Redirect to /login
```

---

## 🚨 Common Issues & Fixes

### Backend won't start
```bash
# Port in use
lsof -i :8000
kill -9 <PID>

# Module not found
pip install -r requirements.txt

# Database error
# Change DATABASE_URL to: sqlite:///./teamsplit.db
```

### Frontend won't start
```bash
# Port in use
lsof -i :4200
kill -9 <PID>

# Missing modules
rm -rf node_modules
npm install

# API not responding
# Check backend is running on :8000
```

---

## 📦 Dependencies

### Backend
- `fastapi` - Web framework
- `sqlmodel` - ORM + schema validation
- `python-jose` - JWT tokens
- `passlib` - Password hashing
- `uvicorn` - ASGI server

### Frontend
- `@angular/core` - Framework
- `rxjs` - Reactive programming
- `tailwindcss` - Styling
- `axios` - HTTP client

---

## 🧪 Testing

### Backend
```bash
cd backend
pytest tests/ -v
```

### Frontend
```bash
cd frontend
npm test
```

---

## 📚 Documentation

1. **GETTING_STARTED.md** - Step-by-step setup
2. **IMPLEMENTATION_SUMMARY.md** - Complete overview
3. **backend/README.md** - Backend details
4. **frontend/README.md** - Frontend details
5. **API Docs** - http://localhost:8000/docs

---

## 🎯 Feature Checklist

### Core
- ✅ User authentication
- ✅ Team management
- ✅ Expense tracking
- ✅ Settlement calculations
- ✅ Balance display

### UI/UX
- ✅ Mobile-responsive design
- ✅ Form validation
- ✅ Error messages
- ✅ Loading states
- ✅ Empty states

### Security
- ✅ JWT authentication
- ✅ Password hashing
- ✅ CORS protection
- ✅ Team membership checks

---

## 🚀 Deployment

### Heroku/Railway (Backend)
```bash
git push heroku main
```

### Firebase (Frontend)
```bash
firebase deploy --only hosting
```

### AWS EC2 (Backend)
See backend/README.md

### Aiven PostgreSQL (Database)
See backend/README.md

---

## 💡 Tips & Tricks

### Development
- Use `ng serve --open` to auto-open browser
- Use `--reload` flag for hot reload
- Check browser DevTools for errors
- Use Swagger UI for API testing

### Debugging
- Backend: Add `print()` statements
- Frontend: Use `console.log()`
- Check network tab in DevTools
- Look at request/response payloads

### Performance
- Use Angular DevTools extension
- Lazy load routes
- Minimize component re-renders
- Use trackBy in *ngFor

---

## 📞 Support

- **Issues?** Check documentation files
- **Error message?** Search in code/docs
- **Feature idea?** Add to future enhancements
- **Bug found?** Create detailed issue

---

**Version:** 1.0.0 | **Status:** ✅ Production Ready | **Last Update:** Dec 6, 2025
