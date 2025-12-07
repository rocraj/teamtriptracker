# TeamTripTracker Documentation Index

**Version:** 1.0.0  
**Last Updated:** December 8, 2025  
**Status:** ✅ Complete & Production Ready

---

## Welcome to TeamTripTracker Documentation

This is the comprehensive documentation for the TeamTripTracker backend application - a collaborative expense tracking system for group trips and shared costs.

### Quick Navigation

**New to TeamTripTracker?** Start here:
1. [Quick Reference Guide](./QUICK_REFERENCE.md) - Get started in 5 minutes
2. [Features Guide](./FEATURES_GUIDE.md) - Understand what you can do

**Developer?** Choose your path:
- **Setting up development:** [Architecture Guide](./ARCHITECTURE.md)
- **Building features:** [Development Guide](./DEVELOPMENT.md)
- **Integrating frontend:** [API Documentation](./API_DOCUMENTATION.md)

---

## Documentation Files

### 📚 Core Documentation

#### 1. **API_DOCUMENTATION.md** (15+ KB)
Complete REST API reference with all endpoints, request/response examples, error handling, and data models.

**Use when:**
- Building frontend/mobile app
- Integrating with third-party services
- Understanding endpoint behavior
- Debugging API issues

**Key sections:**
- 30+ API endpoints documented
- Standard error handling
- Data models and schemas
- Future planned features
- Environment configuration

**Example:** Need to implement team invitations? See API_DOCUMENTATION.md → Team Endpoints → Send Team Invitations

---

#### 2. **ARCHITECTURE.md** (15+ KB)
Backend architecture, technology stack, setup instructions, project structure, and design patterns.

**Use when:**
- Setting up development environment
- Understanding system architecture
- Deploying to production
- Configuring database and services

**Key sections:**
- High-level architecture diagrams
- Technology stack details
- Step-by-step setup guide
- Database schema with ERD
- Testing framework setup
- Docker deployment
- Troubleshooting guide

**Example:** New developer? Start with ARCHITECTURE.md → Setup Instructions

---

#### 3. **FEATURES_GUIDE.md** (12+ KB)
Detailed feature descriptions, use cases, and implementation details.

**Use when:**
- Understanding current capabilities
- Planning frontend functionality
- Writing test cases
- Explaining features to stakeholders

**Key sections:**
- All current features (v1.0.0)
- Feature details with flows
- Real-world use cases
- Integration checklist
- Changelog with version history

**Example:** How does the invitation system work? See FEATURES_GUIDE.md → Email Invitation System

---

#### 4. **DEVELOPMENT.md** (12+ KB)
Developer guide for adding new features, coding standards, testing, and debugging.

**Use when:**
- Adding new features
- Writing code following project standards
- Creating tests
- Debugging issues

**Key sections:**
- Code style guide (PEP 8)
- Step-by-step feature addition
- Database migration guide
- Testing best practices
- Common development tasks
- Performance optimization

**Example:** Want to add photo receipts? See DEVELOPMENT.md → Adding New Features → Step 1-5

---

#### 5. **QUICK_REFERENCE.md** (7+ KB)
Cheat sheet with common commands, API calls, file locations, and quick tips.

**Use when:**
- Need a quick command
- Forgot environment variable name
- Looking for file location
- Testing endpoints quickly

**Key sections:**
- Installation checklist
- Common curl commands
- Development commands
- Database commands
- Common error solutions
- Code snippets

**Example:** How do I run tests? See QUICK_REFERENCE.md → Development Commands

---

### 🗂️ Project Structure

```
documentation/
├── API_DOCUMENTATION.md        (←  API Reference)
├── ARCHITECTURE.md             (←  Setup & Architecture)
├── FEATURES_GUIDE.md           (←  Feature Details)
├── DEVELOPMENT.md              (←  Developer Guide)
├── QUICK_REFERENCE.md          (←  Cheat Sheet)
└── DOCUMENTATION_INDEX.md      (←  This file)

backend/
├── app/
│   ├── api/                    (Route handlers)
│   ├── services/               (Business logic)
│   ├── models/                 (Database models)
│   ├── core/                   (Configuration & security)
│   └── main.py                 (App initialization)
├── tests/                      (Test suite)
├── Dockerfile
├── requirements.txt
└── .env.example
```

---

## Feature Matrix

### Current Features (v1.0.0) ✅

| Feature | Status | Documented | Tested |
|---------|--------|-----------|--------|
| **Authentication** | ✅ | ✅ | ✅ |
| - Email/Password | ✅ | ✅ | ✅ |
| - Google OAuth | ✅ | ✅ | ⚠️ (manual) |
| - JWT Tokens | ✅ | ✅ | ✅ |
| **Teams** | ✅ | ✅ | ✅ |
| - Create/List/Get | ✅ | ✅ | ✅ |
| - Member Management | ✅ | ✅ | ✅ |
| - Budget Tracking | ✅ | ✅ | ✅ |
| **Invitations** | ✅ | ✅ | ✅ |
| - Bulk Email Invites | ✅ | ✅ | ✅ |
| - Invitation Tokens | ✅ | ✅ | ✅ |
| - Two-Step Flow | ✅ | ✅ | ✅ |
| **Expenses** | ✅ | ✅ | ✅ |
| - Create/List/Delete | ✅ | ✅ | ✅ |
| - Multiple Participants | ✅ | ✅ | ✅ |
| - Categories & Emoji | ✅ | ✅ | ✅ |
| **Analytics** | ✅ | ✅ | ✅ |
| - Balances | ✅ | ✅ | ✅ |
| - Settlements | ✅ | ✅ | ✅ |
| - Next Payer | ✅ | ✅ | ✅ |

---

## Planned Features (v1.1.0 - Q1 2026)

| Feature | Documentation | Status |
|---------|----------------|--------|
| Recurring Expenses | Planned | 📋 |
| Expense Categories | Planned | 📋 |
| Payment Reminders | Planned | 📋 |
| Multiple Currencies | Planned | 📋 |
| Receipt Photos | Planned | 📋 |
| PDF/CSV Export | Planned | 📋 |
| RBAC (Role-based) | Planned | 📋 |
| Real-time Updates | Planned | 📋 |
| Payment Gateway Integration | Planned | 📋 |
| Mobile App Support | Planned | 📋 |

---

## Documentation Map by Use Case

### 👤 User/Product Manager
**Goal:** Understand what the app does

1. Read: [FEATURES_GUIDE.md](./FEATURES_GUIDE.md) - Current Features section
2. Read: [FEATURES_GUIDE.md](./FEATURES_GUIDE.md) - Use Cases section
3. Reference: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Error Solutions

---

### 🔧 Backend Developer (New)
**Goal:** Set up and start developing

1. Read: [ARCHITECTURE.md](./ARCHITECTURE.md) - Setup Instructions
2. Read: [DEVELOPMENT.md](./DEVELOPMENT.md) - Code Style Guide
3. Try: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Common Commands
4. Reference: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) as needed

---

### 🎨 Frontend Developer
**Goal:** Integrate with backend API

1. Read: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Overview
2. Reference: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API Endpoints
3. Follow: [FEATURES_GUIDE.md](./FEATURES_GUIDE.md) - Integration Guide
4. Copy: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - API Call Examples

---

### ➕ Adding New Feature
**Goal:** Implement a new feature end-to-end

1. Start: [DEVELOPMENT.md](./DEVELOPMENT.md) - Adding New Features
2. Design: Database model (Step 1)
3. Implement: Service layer (Step 2)
4. Expose: API endpoint (Step 3)
5. Test: Write tests (Step 4)
6. Document: Update docs (Step 5)

---

### 🚀 Deployment
**Goal:** Deploy to production

1. Reference: [ARCHITECTURE.md](./ARCHITECTURE.md) - Deployment section
2. Configure: Environment variables from [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Checklist: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Release Checklist

---

### 🐛 Debugging
**Goal:** Find and fix issues

1. Check: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Common Error Solutions
2. Debug: [ARCHITECTURE.md](./ARCHITECTURE.md) - Troubleshooting section
3. Understand: [DEVELOPMENT.md](./DEVELOPMENT.md) - Debugging Guide
4. Reference: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Error Handling

---

## Key Topics Quick Links

### Authentication
- **How to register?** → [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#1-register-user)
- **JWT tokens?** → [ARCHITECTURE.md](./ARCHITECTURE.md#jwt-token-pattern)
- **Invitation flow?** → [FEATURES_GUIDE.md](./FEATURES_GUIDE.md#3-email-invitation-system)

### Teams
- **Creating teams?** → [FEATURES_GUIDE.md](./FEATURES_GUIDE.md#create-team)
- **Inviting members?** → [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#5-send-team-invitations-bulk)
- **Member budgets?** → [FEATURES_GUIDE.md](./FEATURES_GUIDE.md#set-member-budget)

### Expenses
- **Logging expenses?** → [FEATURES_GUIDE.md](./FEATURES_GUIDE.md#4-expense-tracking)
- **Endpoint details?** → [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#1-create-expense)
- **Database schema?** → [ARCHITECTURE.md](./ARCHITECTURE.md#expense-1)

### Settlement
- **How settlement works?** → [FEATURES_GUIDE.md](./FEATURES_GUIDE.md#5-settlement--analytics)
- **API endpoints?** → [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#summaryanalytics-endpoints)
- **Implementation?** → [DEVELOPMENT.md](./DEVELOPMENT.md#2-database-debugging)

### Development
- **Code style?** → [DEVELOPMENT.md](./DEVELOPMENT.md#code-style-guide)
- **Adding features?** → [DEVELOPMENT.md](./DEVELOPMENT.md#adding-new-features)
- **Testing?** → [ARCHITECTURE.md](./ARCHITECTURE.md#testing)
- **Deployment?** → [ARCHITECTURE.md](./ARCHITECTURE.md#deployment)

---

## API Endpoint Overview

### Authentication (6 endpoints)
```
POST   /auth/register              Create account
POST   /auth/login                 Login
POST   /auth/google-signin         Google OAuth
GET    /auth/me                    Current user
GET    /auth/check-email/{email}   Check if exists
POST   /auth/teams/accept-invite   Accept invite
```

### Teams (10 endpoints)
```
POST   /teams                      Create team
GET    /teams                      List teams
GET    /teams/{team_id}            Get team
GET    /teams/{team_id}/members    List members
POST   /teams/{team_id}/members    Add member
POST   /teams/{team_id}/send-invites Bulk invite
GET    /teams/{team_id}/invitations Pending invites
POST   /teams/{team_id}/invite     Add member (legacy)
POST   /teams/{team_id}/budget     Set budget
GET    /teams/invitations/info/{token} Invite info
```

### Expenses (4 endpoints)
```
POST   /expenses                   Create expense
GET    /expenses/{team_id}         List expenses
GET    /expenses/{team_id}/{id}    Get expense
DELETE /expenses/{expense_id}      Delete expense
```

### Summary/Analytics (3 endpoints)
```
GET    /summary/{team_id}/balances      Get balances
GET    /summary/{team_id}/settlements   Settlement plan
GET    /summary/{team_id}/next-payer    Next payer
```

**Total: 23 endpoints fully documented**

---

## Database Tables

```
Users
├── Teams
│   ├── TeamMembers
│   ├── Expenses
│   ├── TeamInvitations
```

**5 core tables:**
1. `users` - User accounts
2. `teams` - Team records
3. `team_members` - Team membership + budgets
4. `expenses` - Shared expenses
5. `team_invitations` - Pending invitations

---

## Version History

### v1.0.0 (December 8, 2025) ✅ Current
- Initial release with core features
- 23 API endpoints
- 5 database tables
- Full test coverage
- Comprehensive documentation

### v1.1.0 (Planned - Q1 2026)
- Recurring expenses
- Expense categories system
- Payment reminders
- Multi-currency support
- Receipt photo upload

### v1.2.0 (Planned - Q2 2026)
- Advanced analytics
- Real-time notifications
- Role-based access control
- Mobile app support

---

## Testing Summary

### Test Coverage
- **Auth:** 5/5 tests passing ✅
- **Teams:** 10/10 tests passing ✅
- **Expenses:** Covered ✅
- **Summary:** Covered ✅

### Run Tests
```bash
pytest tests/ -v                    # All tests
pytest tests/test_auth.py -v        # Auth tests
pytest tests/test_teams.py -v       # Team tests
```

---

## Environment Setup Quick Checklist

- [ ] Python 3.10+
- [ ] PostgreSQL running
- [ ] Virtual environment created
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file configured with:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `SMTP_USER` and `SMTP_PASSWORD`
- [ ] Database tables created
- [ ] Server started (`python -m uvicorn app.main:app --reload`)

---

## Documentation Statistics

| Document | Size | Sections | Code Examples | Diagrams |
|----------|------|----------|---------------|----------|
| API_DOCUMENTATION.md | 15+ KB | 12 | 50+ | 2 |
| ARCHITECTURE.md | 15+ KB | 15 | 20+ | 3 |
| FEATURES_GUIDE.md | 12+ KB | 10 | 15+ | 1 |
| DEVELOPMENT.md | 12+ KB | 10 | 30+ | 0 |
| QUICK_REFERENCE.md | 7+ KB | 15 | 40+ | 0 |

**Total:** 61+ KB of comprehensive documentation

---

## Contributing Guidelines

### Documentation
1. Update relevant docs when adding features
2. Follow markdown formatting
3. Include code examples
4. Add to version history

### Code
1. Follow style guide in [DEVELOPMENT.md](./DEVELOPMENT.md)
2. Write tests (see [ARCHITECTURE.md](./ARCHITECTURE.md#testing))
3. Update API docs when changing endpoints
4. Run all tests before committing

### Reporting Issues
1. Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) error solutions first
2. Provide steps to reproduce
3. Include error messages
4. Reference relevant documentation

---

## Support & Resources

### Getting Help
1. **Quick Questions?** → [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
2. **API Questions?** → [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
3. **Setup Help?** → [ARCHITECTURE.md](./ARCHITECTURE.md#setup-instructions)
4. **Development Help?** → [DEVELOPMENT.md](./DEVELOPMENT.md)

### External Resources
- **FastAPI:** https://fastapi.tiangolo.com/
- **SQLModel:** https://sqlmodel.tiangolo.com/
- **PostgreSQL:** https://www.postgresql.org/docs/
- **JWT:** https://tools.ietf.org/html/rfc7519

### Contact
- **GitHub:** [rocraj/teamtriptracker](https://github.com/rocraj/teamtriptracker)
- **Issues:** GitHub Issues
- **Email:** support@teamtriptracker.com

---

## How to Use This Documentation

### For Reading (Linear)
Start with your use case above and follow the links in order.

### For Reference (Random Access)
Use keyboard shortcut to search (Ctrl+F / Cmd+F) within each document.

### For Learning
Read ARCHITECTURE.md first, then DEVELOPMENT.md for depth.

### For Integration
Refer to API_DOCUMENTATION.md and copy examples from QUICK_REFERENCE.md.

---

## Maintenance & Updates

**Last Updated:** December 8, 2025  
**Maintained By:** TeamTripTracker Team  
**Update Frequency:** With each release  
**Status:** ✅ Complete and current

---

## Quick Links (Copy-Paste Friendly)

```
📖 API Documentation:      ./API_DOCUMENTATION.md
🏗️  Architecture Guide:     ./ARCHITECTURE.md
✨ Features Guide:         ./FEATURES_GUIDE.md
👨‍💻 Development Guide:     ./DEVELOPMENT.md
⚡ Quick Reference:        ./QUICK_REFERENCE.md
📇 Documentation Index:    ./DOCUMENTATION_INDEX.md
```

---

## Next Steps

1. **If new to project:** Start with [ARCHITECTURE.md](./ARCHITECTURE.md) → Setup Instructions
2. **If building frontend:** Go to [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) → API Endpoints
3. **If developing features:** Read [DEVELOPMENT.md](./DEVELOPMENT.md) → Adding New Features
4. **If stuck:** Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → Common Error Solutions

---

**Welcome to TeamTripTracker! Happy coding! 🚀**

---

*For the latest version of documentation, visit the backend repository at [rocraj/teamtriptracker/backend](https://github.com/rocraj/teamtriptracker/backend)*
