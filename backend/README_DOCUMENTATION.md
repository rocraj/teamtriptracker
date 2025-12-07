# 📚 TeamTripTracker Documentation

**Complete documentation for TeamTripTracker Backend API**

---

## 📖 Documentation Files

### Core Documentation Files (in root directory)

#### 1. **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** ⭐ START HERE
The master index and navigation guide for all documentation.
- **Size:** 15 KB
- **Purpose:** Help you find what you need
- **Best for:** First-time readers, navigation

#### 2. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** 🔌 REST API
Complete REST API reference with all 23 endpoints.
- **Size:** 20 KB
- **Sections:** 30+ endpoints, data models, error handling
- **Best for:** Frontend developers, API integration

#### 3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** 🏗️ SYSTEM DESIGN
Backend architecture, setup guide, and deployment instructions.
- **Size:** 22 KB
- **Sections:** Architecture diagrams, database schema, setup, testing, deployment
- **Best for:** Backend developers, DevOps engineers

#### 4. **[FEATURES_GUIDE.md](./FEATURES_GUIDE.md)** ✨ CAPABILITIES
Detailed feature descriptions with use cases and workflows.
- **Size:** 15 KB
- **Sections:** Current features, use cases, changelog, best practices
- **Best for:** Product managers, stakeholders, feature planning

#### 5. **[DEVELOPMENT.md](./DEVELOPMENT.md)** 👨‍💻 CODING GUIDE
Developer guide for adding features and following code standards.
- **Size:** 20 KB
- **Sections:** Code style, feature addition, testing, debugging, patterns
- **Best for:** Backend developers, feature implementers

#### 6. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** ⚡ CHEAT SHEET
Quick commands, API calls, and common solutions.
- **Size:** 9.6 KB
- **Sections:** Common commands, curl examples, error solutions
- **Best for:** Quick lookups, command reference

---

## 🎯 Choose Your Path

### 👤 "I want to understand the product"
**Read in this order:**
1. [FEATURES_GUIDE.md](./FEATURES_GUIDE.md) - Current Features section
2. [FEATURES_GUIDE.md](./FEATURES_GUIDE.md) - Use Cases section
3. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Overview section

**Time:** 15-20 minutes

---

### 🔧 "I want to set up development"
**Read in this order:**
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Setup Instructions
2. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Installation section
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - Troubleshooting section

**Time:** 30-45 minutes

---

### 🎨 "I want to build the frontend"
**Read in this order:**
1. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Overview & Authentication
2. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API Endpoints
3. [FEATURES_GUIDE.md](./FEATURES_GUIDE.md) - Integration Guide
4. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - API Call Examples

**Time:** 45-60 minutes

---

### ➕ "I want to add a new feature"
**Read in this order:**
1. [DEVELOPMENT.md](./DEVELOPMENT.md) - Code Style Guide
2. [DEVELOPMENT.md](./DEVELOPMENT.md) - Adding New Features
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - Testing section
4. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Common Commands

**Time:** 60-120 minutes (depends on feature complexity)

---

### 🚀 "I want to deploy to production"
**Read in this order:**
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Environment Configuration
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Deployment section
3. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Release Checklist

**Time:** 30-45 minutes

---

### 🐛 "Something is broken"
**Read in this order:**
1. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Common Error Solutions
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Troubleshooting section
3. [DEVELOPMENT.md](./DEVELOPMENT.md) - Debugging Guide

**Time:** 10-30 minutes

---

## 📊 Documentation Statistics

| Document | Size | Type | Topics |
|----------|------|------|--------|
| API_DOCUMENTATION.md | 20 KB | Reference | 30+ endpoints |
| ARCHITECTURE.md | 22 KB | Guide | Setup, architecture, deployment |
| FEATURES_GUIDE.md | 15 KB | Guide | Features, use cases, changelog |
| DEVELOPMENT.md | 20 KB | Guide | Code style, patterns, testing |
| QUICK_REFERENCE.md | 9.6 KB | Reference | Commands, quick tips |
| DOCUMENTATION_INDEX.md | 15 KB | Index | Navigation, overview |
| **Total** | **~102 KB** | - | **Comprehensive** |

---

## 🔍 Search by Topic

### Authentication
- Email/Password: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#1-register-user)
- Google OAuth: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#3-google-sign-in)
- JWT Tokens: [ARCHITECTURE.md](./ARCHITECTURE.md#jwt-token-pattern)
- Team Invitations: [FEATURES_GUIDE.md](./FEATURES_GUIDE.md#3-email-invitation-system)

### Teams
- Create Teams: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#1-create-team)
- Member Management: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#8-add-team-member-existing-user)
- Bulk Invitations: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#5-send-team-invitations-bulk)
- Budget Tracking: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#10-set-member-budget)

### Expenses
- Create Expenses: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#1-create-expense)
- List Expenses: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#2-list-team-expenses)
- Delete Expenses: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#4-delete-expense)

### Settlement & Analytics
- Balances: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#1-get-team-balances)
- Settlements: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#2-get-settlement-plan)
- Algorithm: [FEATURES_GUIDE.md](./FEATURES_GUIDE.md#get-settlement-plan)

### Development
- Code Style: [DEVELOPMENT.md](./DEVELOPMENT.md#code-style-guide)
- Adding Features: [DEVELOPMENT.md](./DEVELOPMENT.md#adding-new-features)
- Testing: [ARCHITECTURE.md](./ARCHITECTURE.md#testing)
- Database: [ARCHITECTURE.md](./ARCHITECTURE.md#database-schema)

---

## 🚀 Quick Start

### Installation (5 min)
```bash
git clone https://github.com/rocraj/teamtriptracker.git
cd teamtriptracker/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
python -m uvicorn app.main:app --reload
```

See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md#quick-start) for detailed steps.

### Test Installation
```bash
# Run tests
pytest tests/ -v

# View API docs
# Open http://localhost:8000/docs
```

---

## 📋 Feature Overview

### Current Features (v1.0.0) ✅

**Core Features:**
- ✅ Email/Password Authentication
- ✅ Google OAuth Integration
- ✅ Team Creation & Management
- ✅ Team Member Management with Budgets
- ✅ Email-Based Bulk Invitations
- ✅ Invitation Token System (7-day expiry)
- ✅ Smart Two-Step Invitation Flow
- ✅ Expense Tracking with Participants
- ✅ Expense Categories & Emoji
- ✅ Settlement Calculation (Optimized)
- ✅ User Balance Tracking
- ✅ Next Payer Suggestion

**Security:**
- ✅ Password Hashing (Argon2)
- ✅ JWT Token Validation
- ✅ User Authorization Checks
- ✅ CORS Protection
- ✅ SQL Injection Protection

### Planned Features (v1.1.0 - Q1 2026)

See [FEATURES_GUIDE.md](./FEATURES_GUIDE.md#version-11-0-planned-q1-2026) for details.

---

## 💡 Key Concepts

### Invitation Flow
Users can be invited to teams via email. The system handles both new users (signup with token) and existing users (login then accept).

See [FEATURES_GUIDE.md](./FEATURES_GUIDE.md#3-email-invitation-system)

### Settlement Algorithm
Calculates optimal payment plan with minimum number of transactions to settle all debts.

See [FEATURES_GUIDE.md](./FEATURES_GUIDE.md#get-settlement-plan)

### JWT Authentication
All API requests (except public endpoints) require JWT token in Authorization header.

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#jwt-token-based-authentication)

---

## 🛠️ Technology Stack

- **Framework:** FastAPI (async)
- **Database:** PostgreSQL with SQLModel ORM
- **Authentication:** JWT (HS256)
- **Password:** Argon2
- **Email:** Google SMTP
- **Testing:** pytest
- **Python:** 3.10+

See [ARCHITECTURE.md](./ARCHITECTURE.md#technology-stack) for details.

---

## 📞 Support & Help

### Documentation Navigation
- **First time here?** → [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
- **Building feature?** → [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Need API reference?** → [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Quick lookup?** → [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

### External Resources
- FastAPI Documentation: https://fastapi.tiangolo.com/
- SQLModel Documentation: https://sqlmodel.tiangolo.com/
- PostgreSQL Documentation: https://www.postgresql.org/docs/

### Report Issues
1. Check relevant documentation section
2. Review [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) error solutions
3. Open GitHub issue with details

---

## 📝 Version Information

**Current Version:** 1.0.0  
**Release Date:** December 8, 2025  
**Status:** ✅ Production Ready

**Documentation Coverage:**
- ✅ API Endpoints: 23/23 documented
- ✅ Database Tables: 5/5 documented
- ✅ Services: All documented
- ✅ Setup Guide: Complete
- ✅ Testing Guide: Complete
- ✅ Deployment Guide: Complete

---

## 🎓 Learning Path

### Beginner
1. [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) - 10 min
2. [FEATURES_GUIDE.md](./FEATURES_GUIDE.md) - Current Features - 15 min
3. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick Start - 10 min

### Intermediate
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Full document - 30 min
2. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Full document - 30 min
3. [FEATURES_GUIDE.md](./FEATURES_GUIDE.md) - Full document - 20 min

### Advanced
1. [DEVELOPMENT.md](./DEVELOPMENT.md) - Full document - 30 min
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Database & Design Patterns - 20 min
3. Project code walkthrough - 60+ min

---

## ✅ Maintenance & Updates

| Document | Last Updated | Status | Maintainer |
|----------|---|--------|---|
| API_DOCUMENTATION.md | Dec 8, 2025 | ✅ Current | Team |
| ARCHITECTURE.md | Dec 8, 2025 | ✅ Current | Team |
| FEATURES_GUIDE.md | Dec 8, 2025 | ✅ Current | Team |
| DEVELOPMENT.md | Dec 8, 2025 | ✅ Current | Team |
| QUICK_REFERENCE.md | Dec 8, 2025 | ✅ Current | Team |

---

## 📈 Documentation Quality

- **Completeness:** 100% ✅
- **Code Examples:** 100+ ✅
- **Diagrams:** 6+ ✅
- **Search Indexed:** Yes ✅
- **Mobile Friendly:** Yes ✅

---

## 🤝 Contributing to Documentation

When adding new features:
1. Update relevant documentation file
2. Add examples and use cases
3. Update version history
4. Run through documentation index

See [DEVELOPMENT.md](./DEVELOPMENT.md#step-5-update-documentation) for details.

---

## 📚 File Organization

```
Documentation Structure:
├── DOCUMENTATION_INDEX.md       (← Master Index)
├── API_DOCUMENTATION.md         (← API Reference)
├── ARCHITECTURE.md              (← System Design)
├── FEATURES_GUIDE.md            (← Feature Details)
├── DEVELOPMENT.md               (← Developer Guide)
├── QUICK_REFERENCE.md           (← Cheat Sheet)
└── README.md                    (← This file)
```

**Total Size:** ~102 KB of comprehensive documentation

---

## 🎯 Next Steps

1. **Pick your path** from the options above
2. **Start reading** the recommended documents
3. **Try it out** - set up development environment
4. **Build something** - follow the developer guide
5. **Share feedback** - contribute improvements

---

**Happy Coding! 🚀**

For questions or suggestions about documentation, please open an issue or contact the team.

**Last Updated:** December 8, 2025  
**Version:** 1.0.0  
**Maintained By:** TeamTripTracker Team
