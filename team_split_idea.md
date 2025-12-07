# team_split_idea.md

## 1. Overview

**Team Expense Splitter** is a full-transparency full-stack application for managing group expenses. All members can view each other’s starting budgets, total amounts paid, remaining budgets, and net balances. The app supports splitting expenses among all members or only selected participants and calculates minimal “who owes whom” settlements.

## 2. Tech Stack

### Backend
- Node.js
- Express (as Firebase Cloud Functions)
- PostgreSQL (Neon/Supabase/Railway)
- Prisma ORM
- Authentication:
  - Google Sign-In via Firebase Auth
  - Email + JWT login using Gmail SMTP

### Frontend
- React (SPA or SSR)
- TailwindCSS
- Optional server-side template rendering with Express

### Deployment
- Firebase Hosting (frontend)
- Firebase Cloud Functions (backend API)
- External PostgreSQL
- Firebase Auth integration

## 3. Core Features

### Full Transparency Mode
All team members can view:
- Starting budget
- Total paid
- Remaining budget
- Net balance (credit/debit)
- Suggested “next payer”
- All expenses and participants
- Settlement calculations

### Expense Splitting
- Split equally among all members
- Split among selected participants only
- Example: A pays 300 for only C and D

### Budget Tracking
- Team-wide remaining budget
- Individual remaining budgets

## 4. Pages

### Login Page
- Google Sign-In
- Email login using JWT via SMTP
- Secure httpOnly cookies

### Add Team Members Page
- Add/remove members
- Assign starting budgets

### Dashboard
- Team Budget Card
- Member Cards: full transparency stats
- Recent expense list
- Add Expense button

### Add Expense Page
- Description
- Type (emoji + label)
- Amount
- Paid by
- Participants (all or selected)
- Creates per-participant splits

### Summary Page
- Full transparency view of all members
- Graphs and spending timeline
- “Who owes whom” settlement
- Suggested next payer

### Settings Page
- Expense types
- Team name
- Member management

## 5. Settlement Logic

### Balance Calculation
balance = totalPaid - totalShareOwed

### Expense Split Logic
Equal split:
share = amount / totalMembers

Selected participants:
share = amount / participantsCount

### Settlement Algorithm
1. Separate creditors (balance > 0) and debtors (balance < 0)
2. While both lists exist:
   - payment = min(creditor.balance, abs(debtor.balance))
   - debtor pays creditor: payment
   - Update balances
3. Produce minimal settlement list

### Suggested Next Payer
Member with largest negative balance.

## 6. Database Models (Prisma)

model User {
  id        String @id @default(cuid())
  email     String @unique
  name      String?
  googleId  String?
  createdAt DateTime @default(now())
}

model Team {
  id      String @id @default(cuid())
  name    String
  ownerId String
}

model Member {
  id             String @id @default(cuid())
  teamId         String
  name           String
  startingBudget Float
}

model ExpenseType {
  id      String @id @default(cuid())
  teamId  String
  emoji   String
  label   String
}

model Expense {
  id             String @id @default(cuid())
  teamId         String
  description    String?
  amount         Float
  paidByMemberId String
  typeId         String
  createdAt      DateTime @default(now())
}

model ExpenseSplit {
  id         String @id @default(cuid())
  expenseId  String
  memberId   String
  shareAmount Float
}

## 7. API Endpoints

### Auth
POST /auth/google
POST /auth/email/request
POST /auth/email/verify
POST /auth/logout

### Team
POST /team
GET /team/:id
POST /team/:id/members

### Expenses
POST /expenses
GET /team/:id/expenses

### Expense Types
POST /expense-types
DELETE /expense-types/:id

### Settlement
GET /team/:id/settlement

## 8. Security
- JWT in httpOnly cookie
- Firebase Auth token verification
- Rate limits
- Sanitized inputs
- Environment variables for DB, JWT, SMTP
- DB firewall rules

## 9. Deployment Architecture
- React via Firebase Hosting
- Node+Express via Firebase Functions
- PostgreSQL external
- Rewrites: /api/** → Cloud Functions

## 10. Future Enhancements
- CSV/PDF export
- OCR for receipts
- Real-time sync via Firestore
- Offline PWA
- Multi-team switching
- Per-category analytics
