# TeamTripTracker API Documentation

**Version:** 1.0.0  
**Last Updated:** December 8, 2025  
**Base URL:** `http://localhost:8000` (development)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Auth Endpoints](#auth-endpoints)
   - [Team Endpoints](#team-endpoints)
   - [Expense Endpoints](#expense-endpoints)
   - [Summary/Analytics Endpoints](#summaryanalytics-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Environment Configuration](#environment-configuration)
8. [Future Features](#future-features)

---

## Overview

TeamTripTracker is a collaborative expense tracking application designed for group trips. It allows users to:

- Create and manage teams
- Track shared expenses
- Invite team members via email
- Calculate settlements and balances
- Manage budgets per team member
- Get analytics on spending patterns

### Key Features

- **User Authentication** - Email/password and Google OAuth
- **Team Management** - Create teams, invite members
- **Expense Tracking** - Log expenses with multiple participants
- **Smart Settlement Calculation** - Determine who owes whom
- **Budget Planning** - Set and track individual budgets
- **Email Invitations** - Send team invites via Google SMTP

---

## Authentication

### JWT Token-Based Authentication

All protected endpoints require a valid JWT token in the `Authorization` header.

**Header Format:**
```
Authorization: Bearer {access_token}
```

**Token Details:**
- Algorithm: HS256
- Expiration: 24 hours (configurable via `JWT_EXPIRATION_MINUTES`)
- Payload: Contains `sub` (user_id) and `exp` (expiration time)

### Authentication Flows

#### Flow 1: Email/Password Registration & Login
1. User registers with email and password
2. System creates account and returns access token
3. Token used for subsequent API calls

#### Flow 2: Google OAuth
1. User authenticates with Google
2. System creates/updates user record
3. Returns access token

#### Flow 3: Team Invitation (New User)
1. User receives invitation email with link containing token
2. Frontend checks if email has existing account
3. If no account: User signs up with invitation_token parameter
4. System auto-adds user to team after signup

#### Flow 4: Team Invitation (Existing User)
1. User receives invitation email
2. If logged in: Clicks "Accept" and calls accept-invite endpoint
3. If logged out: Logs in first, then accepts invitation

---

## API Endpoints

### Auth Endpoints

#### 1. Register User
```
POST /auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePassword123!",
  "auth_provider": "email",
  "invitation_token": "optional-token-for-auto-joining-team"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Error Responses:**
- `400 Bad Request` - Email already exists or invalid password
- `400 Bad Request` - Invalid invitation token (if provided)

**Note:** If `invitation_token` is valid and email matches, user is automatically added to the team.

---

#### 2. Login User
```
POST /auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid email or password

---

#### 3. Google Sign In
```
POST /auth/google-signin
```

**Request:**
```json
{
  "email": "user@gmail.com",
  "name": "John Doe",
  "photo_url": "https://..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Note:** Creates user if doesn't exist, updates if exists.

---

#### 4. Get Current User
```
GET /auth/me
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "photo_url": "https://...",
  "auth_provider": "email",
  "created_at": "2025-12-08T10:30:00"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired token
- `404 Not Found` - User not found

---

#### 5. Check Email Exists
```
GET /auth/check-email/{email}
```

**Parameters:**
- `email` (string) - Email to check

**Response (200):**
```json
{
  "email": "user@example.com",
  "exists": true,
  "message": "Account exists"
}
```

**Note:** Public endpoint - no authentication required. Helps frontend decide between signup/login.

---

#### 6. Accept Team Invitation (Authenticated User)
```
POST /auth/teams/accept-invite
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "invitation_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "message": "Successfully joined the team",
  "team_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid/expired token or already used
- `403 Forbidden` - Invitation email doesn't match user's email
- `400 Bad Request` - User already a member of team

---

### Team Endpoints

#### 1. Create Team
```
POST /teams
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "name": "Summer Vacation 2025"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Summer Vacation 2025",
  "created_by": "660e8400-e29b-41d4-a716-446655440001",
  "created_at": "2025-12-08T10:30:00"
}
```

**Note:** Creator is automatically added as a team member.

---

#### 2. List User Teams
```
GET /teams
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Summer Vacation 2025",
    "created_by": "660e8400-e29b-41d4-a716-446655440001",
    "created_at": "2025-12-08T10:30:00"
  }
]
```

---

#### 3. Get Team Details
```
GET /teams/{team_id}
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Summer Vacation 2025",
  "created_by": "660e8400-e29b-41d4-a716-446655440001",
  "created_at": "2025-12-08T10:30:00"
}
```

**Error Responses:**
- `404 Not Found` - Team doesn't exist
- `403 Forbidden` - User not a team member

---

#### 4. Get Team Members
```
GET /teams/{team_id}/members
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "team_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "660e8400-e29b-41d4-a716-446655440001",
    "initial_budget": 1000.0
  }
]
```

---

#### 5. Send Team Invitations (Bulk)
```
POST /teams/{team_id}/send-invites
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "emails": [
    "alice@example.com",
    "bob@example.com",
    "charlie@example.com"
  ]
}
```

**Response (200):**
```json
{
  "successful": 2,
  "failed": 1,
  "message": "Successfully sent 2 invitations",
  "details": [
    {
      "email": "alice@example.com",
      "status": "sent"
    },
    {
      "email": "bob@example.com",
      "status": "sent"
    },
    {
      "email": "charlie@example.com",
      "status": "failed"
    }
  ]
}
```

**Features:**
- Validates email format
- Checks if user exists:
  - If exists and already member: Skips
  - If exists and not member: Adds directly to team
  - If doesn't exist: Sends invitation email
- Sends professional HTML emails via Google SMTP
- Marks invitations in database for tracking

---

#### 6. Get Invitation Info (Public)
```
GET /teams/invitations/info/{token}
```

**Parameters:**
- `token` (string) - Invitation token from email

**Response (200):**
```json
{
  "team_name": "Summer Vacation 2025",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "inviter_name": "John Doe",
  "inviter_email": "john@example.com",
  "invitee_email": "alice@example.com",
  "created_at": "2025-12-08T10:30:00",
  "expires_at": "2025-12-15T10:30:00",
  "is_expired": false
}
```

**Note:** Public endpoint - no authentication required. Allows users to see invitation details before signing up.

**Error Responses:**
- `400 Bad Request` - Invalid/expired token
- `400 Bad Request` - Invitation already used

---

#### 7. Get Pending Invitations
```
GET /teams/{team_id}/invitations
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "team_id": "550e8400-e29b-41d4-a716-446655440000",
    "invitee_email": "alice@example.com",
    "inviter_id": "660e8400-e29b-41d4-a716-446655440001",
    "created_at": "2025-12-08T10:30:00",
    "expires_at": "2025-12-15T10:30:00",
    "is_used": false
  }
]
```

**Note:** Only team members can view pending invitations.

---

#### 8. Add Team Member (Existing User)
```
POST /teams/{team_id}/members
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "user_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "initial_budget": 0.0
}
```

---

#### 9. Invite Member (Legacy - Email-Based)
```
POST /teams/{team_id}/invite?email={email}
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "message": "User alice@example.com has been added to the team"
}
```

**Note:** For existing users only. Use send-invites endpoint for bulk invitations.

---

#### 10. Set Member Budget
```
POST /teams/{team_id}/budget
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "budget_amount": 5000.0
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "initial_budget": 5000.0
}
```

---

### Expense Endpoints

#### 1. Create Expense
```
POST /expenses
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_amount": 150.00,
  "participants": [
    "660e8400-e29b-41d4-a716-446655440001",
    "660e8400-e29b-41d4-a716-446655440002"
  ],
  "type_label": "Food",
  "type_emoji": "🍔",
  "note": "Lunch at Italian restaurant"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "payer_id": "660e8400-e29b-41d4-a716-446655440001",
  "total_amount": 150.00,
  "participants": [
    "660e8400-e29b-41d4-a716-446655440001",
    "660e8400-e29b-41d4-a716-446655440002"
  ],
  "type_label": "Food",
  "type_emoji": "🍔",
  "note": "Lunch at Italian restaurant",
  "created_at": "2025-12-08T10:30:00"
}
```

**Error Responses:**
- `403 Forbidden` - User not a team member

---

#### 2. List Team Expenses
```
GET /expenses/{team_id}?limit=100&offset=0
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `limit` (integer, default: 100) - Number of expenses to return
- `offset` (integer, default: 0) - Pagination offset

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "team_id": "550e8400-e29b-41d4-a716-446655440000",
    "payer_id": "660e8400-e29b-41d4-a716-446655440001",
    "total_amount": 150.00,
    "participants": ["660e8400-e29b-41d4-a716-446655440001"],
    "type_label": "Food",
    "type_emoji": "🍔",
    "note": "Lunch",
    "created_at": "2025-12-08T10:30:00"
  }
]
```

---

#### 3. Get Expense Details
```
GET /expenses/{team_id}/{expense_id}
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "payer_id": "660e8400-e29b-41d4-a716-446655440001",
  "total_amount": 150.00,
  "participants": ["660e8400-e29b-41d4-a716-446655440001"],
  "type_label": "Food",
  "type_emoji": "🍔",
  "note": "Lunch",
  "created_at": "2025-12-08T10:30:00"
}
```

---

#### 4. Delete Expense
```
DELETE /expenses/{expense_id}
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "message": "Expense deleted"
}
```

**Error Responses:**
- `403 Forbidden` - User is not the payer or team creator

---

### Summary/Analytics Endpoints

#### 1. Get Team Balances
```
GET /summary/{team_id}/balances
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "balances": {
    "660e8400-e29b-41d4-a716-446655440001": 250.50,
    "660e8400-e29b-41d4-a716-446655440002": -150.25,
    "660e8400-e29b-41d4-a716-446655440003": -100.25
  }
}
```

**Interpretation:**
- Positive: User has spent more than their share
- Negative: User owes money to the team
- Total balances sum to zero (except rounding)

---

#### 2. Get Settlement Plan
```
GET /summary/{team_id}/settlements
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "settlements": [
    {
      "from_user": "660e8400-e29b-41d4-a716-446655440002",
      "to_user": "660e8400-e29b-41d4-a716-446655440001",
      "amount": 150.25
    },
    {
      "from_user": "660e8400-e29b-41d4-a716-446655440003",
      "to_user": "660e8400-e29b-41d4-a716-446655440001",
      "amount": 100.25
    }
  ],
  "total_transactions": 2
}
```

**Interpretation:** Optimal settlement plan with minimum transactions.

---

#### 3. Get Next Payer Suggestion
```
GET /summary/{team_id}/next-payer
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "next_payer_id": "660e8400-e29b-41d4-a716-446655440003",
  "suggested_amount": 250.00
}
```

**Logic:** Suggests user with lowest spending relative to budget.

---

## Data Models

### User
```json
{
  "id": "uuid",
  "email": "string (unique)",
  "name": "string",
  "photo_url": "string (optional)",
  "auth_provider": "email | google",
  "hashed_password": "string (optional, null for Google)",
  "created_at": "datetime"
}
```

### Team
```json
{
  "id": "uuid",
  "name": "string",
  "created_by": "uuid (user_id)",
  "created_at": "datetime"
}
```

### TeamMember
```json
{
  "id": "uuid",
  "team_id": "uuid",
  "user_id": "uuid",
  "initial_budget": "float (default: 0.0)"
}
```

### TeamInvitation
```json
{
  "id": "uuid",
  "team_id": "uuid",
  "invitee_email": "string",
  "inviter_id": "uuid (user_id)",
  "created_at": "datetime",
  "expires_at": "datetime (7 days from creation)",
  "is_used": "boolean"
}
```

### Expense
```json
{
  "id": "uuid",
  "team_id": "uuid",
  "payer_id": "uuid",
  "total_amount": "float",
  "participants": "string (JSON array of UUIDs)",
  "type_label": "string (e.g., Food, Transport)",
  "type_emoji": "string (e.g., 🍔, 🚖)",
  "note": "string (optional)",
  "created_at": "datetime"
}
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "detail": "Descriptive error message"
}
```

### Common HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or invalid state |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Authenticated but not allowed |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 500 | Server Error | Internal server error |

### Common Error Scenarios

**Invalid Token:**
```json
{
  "detail": "Invalid or expired token"
}
```

**Email Already Exists:**
```json
{
  "detail": "Email already registered"
}
```

**User Not Team Member:**
```json
{
  "detail": "You are not a member of this team"
}
```

**Invitation Email Mismatch:**
```json
{
  "detail": "This invitation is for alice@example.com, not bob@example.com. Please logout and login with the correct account."
}
```

---

## Rate Limiting

Currently not implemented. To be added in future versions.

**Planned:**
- 100 requests per minute per user
- 1000 requests per hour per user

---

## Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/teamtriptracker

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# Google OAuth (optional for OAuth support)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# SMTP Configuration (for email invitations)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# URLs
FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:8000

# CORS
CORS_ORIGINS=["http://localhost:4200", "http://localhost:3000"]
```

### Email Setup (Gmail)

1. Enable 2-Step Verification on your Google Account
2. Generate an App Password at: https://myaccount.google.com/apppasswords
3. Use the generated password as `SMTP_PASSWORD`

---

## Future Features

### Planned Features (Phase 2)

#### 1. **Recurring Expenses**
- Set expenses that repeat weekly/monthly
- Auto-create expense entries
- Ability to pause/resume recurring expenses

**Endpoint:**
```
POST /teams/{team_id}/expenses/recurring
```

#### 2. **Expense Categories**
- Pre-defined categories (Food, Transport, Accommodation, etc.)
- Custom user categories
- Category-based expense filtering and analytics

**Endpoint:**
```
GET /teams/{team_id}/expenses?category=food
```

#### 3. **Payment Reminders**
- Send SMS/email reminders for pending settlements
- Configurable reminder frequency
- Mark reminders as sent

**Endpoint:**
```
POST /teams/{team_id}/send-payment-reminders
```

#### 4. **Expense Splitting Strategies**
- Equal split (current)
- Percentage-based split (new)
- Custom amount per person (new)
- Pro-rata based on budget (new)

**Request Enhancement:**
```json
{
  "splitting_strategy": "equal | percentage | custom | prorata",
  "split_details": { /* strategy-specific data */ }
}
```

#### 5. **Transaction History & Audit Log**
- Track all expense modifications
- User action logs
- Settlement status tracking

**Endpoint:**
```
GET /teams/{team_id}/audit-log
```

#### 6. **Multi-Currency Support**
- Support for different currencies
- Real-time conversion rates
- Currency preference per user

**Schema Update:**
```json
{
  "currency": "USD | EUR | GBP | INR",
  "exchange_rates": { /* cached rates */ }
}
```

#### 7. **Photo Receipts**
- Upload receipt photos
- OCR for amount extraction (optional)
- Attach photos to expenses

**Endpoint:**
```
POST /expenses/{expense_id}/receipts
```

#### 8. **Expense Reports**
- PDF/CSV export of team expenses
- Detailed settlement reports
- Monthly summaries

**Endpoint:**
```
GET /teams/{team_id}/reports/export?format=pdf
```

#### 9. **Mobile App Integration**
- Native iOS/Android support
- Offline expense logging
- Push notifications

#### 10. **Role-Based Access Control (RBAC)**
- Admin: Full team management
- Member: Create expenses, view summaries
- Viewer: Read-only access

**Schema Update:**
```json
{
  "team_members": [
    {
      "user_id": "uuid",
      "role": "admin | member | viewer"
    }
  ]
}
```

#### 11. **Real-Time Notifications**
- WebSocket integration
- Real-time balance updates
- Expense notifications

#### 12. **Settlement Payments Integration**
- Link to Stripe/PayPal for direct settlements
- Payment confirmation tracking
- Automated payment reminders

**Endpoint:**
```
POST /teams/{team_id}/settlements/{settlement_id}/pay
```

---

## Versioning

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-08 | Initial release - Core features |

### Breaking Changes

None in v1.0.0

---

## Support & Contact

For issues, feature requests, or questions:
- GitHub Issues: [repository-url]
- Email: support@teamtriptracker.com
- Documentation: https://docs.teamtriptracker.com

---

**Last Updated:** December 8, 2025  
**Maintained By:** TeamTripTracker Team
