# TeamTripTracker Frontend

Angular 17 + TailwindCSS frontend for team expense tracking application.

## Quick Start

```bash
npm install
ng serve
# Navigate to http://localhost:4200
```

## Project Structure

```
src/app/
├── services/           # API & data services (auth, teams, expenses)
├── pages/              # Route-level components
├── components/         # Reusable UI components
├── guards/             # Route protection (AuthGuard)
├── models/             # TypeScript interfaces
└── utils/              # Helper functions
```

## 📚 Documentation

See **DEVELOPMENT_GUIDE.md** for:
- Complete architecture overview
- Authentication implementation pattern
- Teams feature implementation
- Add team member feature
- Feature implementation template for new features
- Best practices and patterns

## ✅ Implemented Features

### Authentication
- User registration (email/password)
- User login
- Google sign-in
- Magic link verification
- Token-based auth with localStorage persistence

### Teams
- Create and manage teams
- List user's teams
- Get team details
- Add team members
- Set member budgets
- Invite members by email

### Expenses
- Track expenses within teams
- Categorize expenses
- View transaction history

### Dashboard
- Overview of teams and balances
- Settlement recommendations

## 🎨 Styling

- **Framework**: Tailwind CSS
- **Approach**: Mobile-first responsive design
- **Components**: Built with pre-existing utility classes

## 🔐 Security

- Bearer token authentication on all protected endpoints
- AuthGuard on protected routes
- Secure token storage in localStorage
- Authorization checks in service layer

## 🚀 Development Patterns

All features follow established patterns - see DEVELOPMENT_GUIDE.md for templates and examples.

When implementing new features:
1. Follow the service pattern (Observable-based)
2. Use component state management template
3. Implement proper error handling
4. Add user feedback (loading, error, success states)
5. Register components in app.module.ts
