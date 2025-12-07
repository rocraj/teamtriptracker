# TeamTripTracker Features Guide

**Version:** 1.0.0  
**Last Updated:** December 8, 2025

---

## Table of Contents

1. [Current Features](#current-features)
2. [Feature Details](#feature-details)
3. [Use Cases](#use-cases)
4. [Integration Guide](#integration-guide)
5. [Changelog](#changelog)

---

## Current Features

### ✅ Version 1.0.0 Features

#### Core Authentication
- [x] Email & Password Registration
- [x] Email & Password Login
- [x] JWT Token-Based Authentication
- [x] Token Expiration & Refresh
- [x] Password Hashing (Argon2)
- [x] Google OAuth Integration
- [x] Current User Profile Endpoint
- [x] Email Existence Check

#### Team Management
- [x] Create Teams
- [x] List User Teams
- [x] View Team Details
- [x] Get Team Members
- [x] Set Member Budgets
- [x] Direct Member Addition (for existing users)

#### Email Invitations (Smart System)
- [x] Bulk Email Invitations
- [x] Invitation Token Generation (JWT-based, 7-day expiry)
- [x] Public Invitation Info (no auth required)
- [x] New User Signup with Invitation Token (auto-join team)
- [x] Existing User Acceptance (login first, then accept)
- [x] Invitation Status Tracking (pending/used)
- [x] Pending Invitations List
- [x] Google SMTP Integration
- [x] HTML Email Templates

#### Expense Tracking
- [x] Create Expenses
- [x] Log Multiple Participants
- [x] Expense Categories (label + emoji)
- [x] Expense Notes
- [x] List Team Expenses (with pagination)
- [x] View Expense Details
- [x] Delete Expenses
- [x] Expense Filtering

#### Settlement & Analytics
- [x] Calculate Team Balances
- [x] Generate Settlement Plans
- [x] Minimize Settlement Transactions
- [x] Next Payer Suggestion
- [x] Balance Per User
- [x] Who-Owes-Whom Calculations

#### Security
- [x] JWT Token Validation
- [x] User Authorization (team membership checks)
- [x] Password Security (Argon2 hashing)
- [x] CORS Protection
- [x] SQL Injection Protection (ORM)
- [x] Email Validation
- [x] Invitation Token Expiration
- [x] User Identity Verification

---

## Feature Details

### 1. Authentication System

#### Registration with Invitation Support
**What:** Users can register and optionally provide an invitation token to auto-join a team.

**When to use:**
- New user receiving team invitation via email
- New user signing up without invitation

**Flow:**
```
1. User receives invitation email
2. Clicks signup link (includes invitation_token)
3. Fills registration form
4. System validates token and matches email
5. Creates account and auto-adds to team
```

**API Endpoint:**
```
POST /auth/register
{
  "email": "user@example.com",
  "name": "John",
  "password": "SecurePass123!",
  "invitation_token": "optional"
}
```

#### Email Existence Check
**What:** Public endpoint to check if email has existing account.

**When to use:**
- Frontend deciding between signup vs login
- User checking account status

**Flow:**
```
GET /auth/check-email/user@example.com
→ { exists: true/false }
```

#### Google OAuth
**What:** Sign in using Google account.

**When to use:**
- Users who prefer not to create new password
- Quick signin with existing Google account

**API Endpoint:**
```
POST /auth/google-signin
{
  "email": "user@gmail.com",
  "name": "John",
  "photo_url": "https://..."
}
```

---

### 2. Team Management

#### Create Team
**What:** Create a new team for expense tracking.

**When to use:**
- Starting a new trip
- Creating team for event/project
- Organizing group activity

**Features:**
- Creator automatically added as member
- Default budget: 0.0
- Unique team per group

**API Endpoint:**
```
POST /teams
{
  "name": "Summer Vacation 2025"
}
```

#### List Teams
**What:** View all teams user is part of.

**When to use:**
- Dashboard - show user's teams
- Team selection
- Team management

**API Endpoint:**
```
GET /teams
→ [{ id, name, created_by, created_at }, ...]
```

#### Get Team Details
**What:** View specific team information.

**When to use:**
- Team page
- Team settings
- Verify team exists

**API Endpoint:**
```
GET /teams/{team_id}
```

#### Set Member Budget
**What:** Set spending limit for team member.

**When to use:**
- Planning trip budget
- Setting spending caps
- Budget management

**Features:**
- Optional budget (can be 0)
- Used in settlement calculations
- Helps identify overspenders

**API Endpoint:**
```
POST /teams/{team_id}/budget
{
  "user_id": "uuid",
  "budget_amount": 5000.0
}
```

---

### 3. Email Invitation System

#### Send Bulk Invitations
**What:** Invite multiple people to team via email.

**When to use:**
- Onboarding team members
- Adding new people to existing team
- Sending invites before trip

**Smart Features:**
- ✅ Validates email format
- ✅ Checks user account status:
  - Existing user + not member: Adds directly (no email)
  - Existing user + already member: Skips
  - New user: Sends invitation email with signup link
- ✅ HTML email templates
- ✅ Google SMTP integration
- ✅ Tracks invitation status

**API Endpoint:**
```
POST /teams/{team_id}/send-invites
{
  "emails": ["alice@example.com", "bob@example.com"]
}
→ {
  "successful": 2,
  "failed": 0,
  "details": [...]
}
```

#### Invitation Info (Public)
**What:** View invitation details without authentication.

**When to use:**
- User checking invitation before signup
- Verifying sender and team
- Deciding whether to accept

**Features:**
- No authentication required
- Shows team name and inviter
- Shows expiration status
- Validates token exists and not expired

**API Endpoint:**
```
GET /teams/invitations/info/{token}
→ {
  "team_name": "...",
  "inviter_name": "...",
  "invitee_email": "...",
  "expires_at": "..."
}
```

#### Accept Invitation (for Existing Users)
**What:** Accept invitation when already logged in.

**When to use:**
- Existing user receiving team invite
- User already has account
- User wants to join team

**Flow:**
```
1. User receives invitation email
2. User logs in if not already logged in
3. User clicks "Accept" or "Join Team"
4. System validates invitation token
5. Adds user to team
6. Marks invitation as used
```

**API Endpoint:**
```
POST /auth/teams/accept-invite
{
  "invitation_token": "..."
}
```

#### Accept Invitation (for New Users)
**What:** Auto-join team during signup with invitation.

**When to use:**
- New user receiving team invite
- User doesn't have existing account
- Want single-step signup+join

**Flow:**
```
1. User clicks signup link (includes token)
2. User fills registration form
3. System validates token email matches signup email
4. Creates account
5. Auto-adds to team
6. Marks invitation as used
```

**API Endpoint:**
```
POST /auth/register
{
  "email": "user@example.com",
  "name": "John",
  "password": "SecurePass123!",
  "invitation_token": "..."
}
```

#### Pending Invitations List
**What:** View all pending team invitations.

**When to use:**
- Team admin managing invites
- Resending invites
- Tracking invitation status

**Features:**
- Shows all non-expired, unused invitations
- Includes sender and recipient email
- Shows creation date and expiration

**API Endpoint:**
```
GET /teams/{team_id}/invitations
→ [{
  "id": "uuid",
  "invitee_email": "...",
  "inviter_id": "...",
  "expires_at": "...",
  "is_used": false
}]
```

---

### 4. Expense Tracking

#### Create Expense
**What:** Log a shared expense and who participated.

**When to use:**
- Restaurant bill split
- Hotel booking
- Activity tickets
- Transport costs
- Any shared expense

**Features:**
- Supports multiple participants
- Category label (Food, Transport, etc.)
- Emoji for quick identification
- Optional notes
- Automatic settlement calculation
- Supports decimal amounts

**API Endpoint:**
```
POST /expenses
{
  "team_id": "uuid",
  "total_amount": 150.00,
  "participants": ["user_id_1", "user_id_2"],
  "type_label": "Food",
  "type_emoji": "🍔",
  "note": "Lunch at restaurant"
}
```

#### List Expenses
**What:** View all team expenses with pagination.

**When to use:**
- Expense history
- Audit trail
- Dashboard
- Trip summary

**Features:**
- Pagination support
- Ordered by creation date
- Full expense details
- Participant information

**API Endpoint:**
```
GET /expenses/{team_id}?limit=100&offset=0
```

#### Expense Details
**What:** Get full information about specific expense.

**When to use:**
- Verify expense details
- Audit expense
- Edit/delete confirmation

**API Endpoint:**
```
GET /expenses/{team_id}/{expense_id}
```

#### Delete Expense
**What:** Remove expense from records.

**When to use:**
- Mistake entry
- Wrong amount
- Cancel transaction

**Restrictions:**
- Only payer or team creator can delete
- Recalculates balances

**API Endpoint:**
```
DELETE /expenses/{expense_id}
```

---

### 5. Settlement & Analytics

#### Get Balances
**What:** See how much each person has spent vs their share.

**When to use:**
- Check standing
- Identify who's ahead/behind
- Trip overview

**Interpretation:**
- Positive: Spent more than fair share
- Negative: Owes money
- Zero: Balanced

**API Endpoint:**
```
GET /summary/{team_id}/balances
→ {
  "balances": {
    "user_1": 250.50,
    "user_2": -150.25,
    "user_3": -100.25
  }
}
```

#### Get Settlement Plan
**What:** See exact payments needed to settle.

**When to use:**
- Trip ending
- Final accounting
- Who pays whom

**Features:**
- Optimized payment plan
- Minimizes number of transactions
- Shows exact amounts and recipients

**Example:**
```
User A spent $300 (owes $100)
User B spent $100 (owes $200)
User C spent $200 (owes $0)

Settlement:
- User A pays $100 to User C
- User B pays $200 to User C
```

**API Endpoint:**
```
GET /summary/{team_id}/settlements
→ {
  "settlements": [{
    "from_user": "uuid",
    "to_user": "uuid",
    "amount": 150.25
  }]
}
```

#### Next Payer Suggestion
**What:** Smart suggestion for who should pay next.

**When to use:**
- Deciding who covers next expense
- Fair rotation
- Budget balancing

**Logic:**
- Suggests user with lowest spending ratio
- Considers budget allocations
- Rotates fairly

**API Endpoint:**
```
GET /summary/{team_id}/next-payer
→ {
  "next_payer_id": "uuid",
  "suggested_amount": 250.00
}
```

---

## Use Cases

### Use Case 1: Team Trip Planning
**Scenario:** Family planning a week-long vacation.

**Steps:**
1. One person creates team "Family Vacation 2025"
2. Sends invites to family members (emails)
3. Family members signup/accept invites
4. During trip, log all shared expenses
5. At end, view settlement plan and settle up

**Endpoints Used:**
- POST /teams
- POST /teams/{team_id}/send-invites
- POST /auth/register (with token)
- POST /expenses
- GET /summary/{team_id}/settlements

---

### Use Case 2: Group Project Budget
**Scenario:** Team working on project with shared budget.

**Steps:**
1. Project lead creates team "Project X"
2. Adds team members
3. Sets individual budgets
4. Team logs project expenses
5. Monitor spending vs budget
6. Regular settlement accounting

**Endpoints Used:**
- POST /teams
- POST /teams/{team_id}/send-invites
- POST /teams/{team_id}/budget
- POST /expenses
- GET /summary/{team_id}/balances
- GET /summary/{team_id}/next-payer

---

### Use Case 3: Shared Apartment
**Scenario:** Roommates sharing apartment costs.

**Steps:**
1. One person creates team "Apartment"
2. Invites roommates
3. Log shared expenses (rent, utilities, groceries)
4. Monthly reconciliation
5. Settle differences

**Endpoints Used:**
- POST /teams
- POST /teams/{team_id}/send-invites
- POST /expenses
- GET /summary/{team_id}/settlements

---

## Integration Guide

### Frontend Integration Checklist

#### Authentication Flow
- [ ] Registration form with email, name, password
- [ ] Login form with email, password
- [ ] Parse invitation token from URL
- [ ] Check email existence before signup/login decision
- [ ] Store JWT token in localStorage/cookie
- [ ] Attach token to all API requests
- [ ] Handle token expiration and refresh
- [ ] Google OAuth integration

#### Team Management
- [ ] Display user teams list
- [ ] Create team form
- [ ] Team details page
- [ ] Team members display
- [ ] Set budget for members
- [ ] Invite members form (bulk email input)
- [ ] Copy invite link for sharing
- [ ] View pending invitations

#### Expenses
- [ ] Expense form (amount, participants, category)
- [ ] Expense list view
- [ ] Expense details modal
- [ ] Delete expense confirmation
- [ ] Category selector with emoji
- [ ] Participant multi-select
- [ ] Notes field

#### Analytics/Summary
- [ ] Balances display (who owes/owed)
- [ ] Settlement plan display
- [ ] Visual representation of balances
- [ ] Next payer suggestion card
- [ ] Expense history/timeline
- [ ] Category breakdown

---

## Changelog

### Version 1.0.0 - Initial Release (2025-12-08)

**Added:**
- ✅ User authentication (email/password, Google OAuth)
- ✅ JWT token-based authorization
- ✅ Team creation and management
- ✅ Team member management
- ✅ Budget tracking per member
- ✅ Email-based team invitations (bulk)
- ✅ Invitation token system (7-day expiry)
- ✅ Smart invitation flow (new and existing users)
- ✅ Expense tracking with multiple participants
- ✅ Expense categories with emoji
- ✅ Settlement calculation algorithm
- ✅ Balance calculation
- ✅ Next payer suggestion
- ✅ Comprehensive API documentation
- ✅ Test suite (15+ tests)
- ✅ Docker support

**Fixed:**
- ✅ UUID/string comparison issues in team membership checks
- ✅ Team creator auto-addition as member
- ✅ Email validation in invitations

**Security:**
- ✅ Password hashing with Argon2
- ✅ JWT token validation
- ✅ User authorization checks
- ✅ CORS protection
- ✅ SQL injection protection (ORM)

---

### Version 1.1.0 - Planned (Q1 2026)

**Planned Features:**
- 🔄 Recurring expenses
- 📊 Expense categories system
- 📱 Payment reminders
- 💵 Multiple currency support
- 📸 Receipt photo upload
- 📄 PDF/CSV export
- 🔐 Role-based access control
- ⚡ Real-time notifications (WebSocket)
- 💳 Stripe/PayPal integration
- 📱 Mobile app support

---

### Version 1.2.0 - Planned (Q2 2026)

**Planned Features:**
- 📈 Advanced analytics
- 📅 Calendar view
- 👥 User profiles
- 🔔 Push notifications
- 🌍 Multi-language support
- 🎨 Theme customization
- ⚙️ User settings
- 🔗 Social sharing
- 📊 Trend analysis

---

## Best Practices

### For Team Admins
1. Set individual budgets early
2. Regularly review settlement plans
3. Keep invited members updated
4. Archive completed teams
5. Use clear expense notes

### For Users
1. Log expenses immediately (while fresh)
2. Include clear notes
3. Add all participants
4. Check balances regularly
5. Settle up promptly

### For Developers
1. Always validate user team membership
2. Use UUIDs for all identifiers
3. Return proper HTTP status codes
4. Validate email addresses
5. Test invitation flows thoroughly

---

**Last Updated:** December 8, 2025  
**Maintained By:** TeamTripTracker Team
