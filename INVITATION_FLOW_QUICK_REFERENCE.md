# Invitation Flow - Quick Reference

## Quick Start

The accept-invite route at `/invite/:token` is now fully optimized to handle all invitation scenarios with email prefilling and smart user state detection.

## What Changed

### 1. **invite-accept.page.ts** - Enhanced Component Logic
- ✅ Validates token and loads invitation data from public endpoint
- ✅ Detects user authentication state
- ✅ Detects email mismatch for authenticated users
- ✅ Prefills `inviteeEmail` for routing to login/signup
- ✅ Provides methods to handle email mismatch scenarios
- ✅ Shows time remaining until invitation expires

### 2. **invite-accept.page.html** - Improved User Experience
- ✅ Displays prefilled email prominently with icon (📧)
- ✅ Shows email mismatch warning with action buttons
- ✅ Different UI for authenticated vs unauthenticated users
- ✅ Clear messaging about email requirements
- ✅ Expiry countdown with urgency indicator

### 3. **Login & Signup Pages** - Email Prefilling
- ✅ Accepts `?email=` query parameter
- ✅ Accepts `?invite=` query parameter (unchanged)
- ✅ Prefills email field automatically
- ✅ Shows invitation banner when token provided

### 4. **AuthService** - New Helper Methods
```typescript
getCurrentUserEmail(): string | null // Get current user's email
getCurrentUser(): User | null         // Get full user object
```

## User Flows

### Flow 1: New User (No Account)
```
/invite/{token}
→ See invitation details + prefilled email
→ Click "Create Account to Accept"
→ Route: /signup?invite={token}&email={invitee_email}
→ Email field auto-filled
→ Complete signup
→ Auto-accept invitation
→ Redirect to team page
```

### Flow 2: Authenticated with Matching Email
```
/invite/{token}
→ See invitation details
→ Email matches logged-in user
→ Click "Accept Invitation"
→ Immediately joins team
→ Redirect to team page
```

### Flow 3: Authenticated with Different Email
```
/invite/{token}
→ See yellow warning: "Email mismatch detected"
→ Option 1: Click "Continue anyway"
  → Join team with current email
→ Option 2: Click "Switch account"
  → Route: /signup?invite={token}&email={invitee_email}
  → Create new account or switch accounts
```

## Key Features

| Feature | Benefit |
|---------|---------|
| **Email Prefilling** | Users don't need to type email - reduces errors |
| **Email Mismatch Detection** | Prevents confusion about which email joined team |
| **Token Validation** | Verifies invitation authenticity on load |
| **Expiry Display** | Shows time remaining to accept |
| **Smart Routing** | Routes user to appropriate auth page with data |
| **Auto-Accept** | After login/signup, invitation accepted automatically |
| **Error Recovery** | Clear error messages with next steps |

## Implementation Details

### Route Parameters

**Invite Page (public, no auth required)**
- `/invite/:token` - Main entry point from email link

**Login/Signup with Invitation**
- `/login?invite={token}&email={invitee_email}`
- `/signup?invite={token}&email={invitee_email}`

### State Management in Component

```typescript
// Token and validation
token: string | null
tokenValid: boolean

// Invitation data (strongly typed)
invitationInfo: InvitationData | null
inviteeEmail: string

// User state
isAuthenticated: boolean
currentUserEmail: string | null

// UI states
emailMatchConfirmed: boolean
showEmailConfirmation: boolean
```

### Critical Methods

| Method | Purpose |
|--------|---------|
| `loadInvitationInfo()` | Fetch invitation details from backend |
| `acceptInvitation()` | Accept invitation (with email validation) |
| `confirmEmailMismatch()` | Confirm acceptance with different email |
| `switchAccount()` | Route to signup with correct email |
| `getTimeUntilExpiry()` | Format remaining time as human-readable |

## Testing Examples

### Test 1: New User Flow
1. Generate invitation with `invitee_email: alice@example.com`
2. Click invite link as unauthenticated user
3. Verify email shows "alice@example.com"
4. Click "Create Account to Accept"
5. Verify signup page has email prefilled
6. Complete signup
7. Verify auto-redirects to team page

### Test 2: Email Mismatch Flow
1. Login as `bob@example.com`
2. Click invite link for `alice@example.com`
3. Verify yellow warning appears
4. Click "Switch account"
5. Verify routed to `/signup?email=alice@example.com&invite={token}`
6. Verify email field prefilled with `alice@example.com`
7. Complete signup
8. Verify invited email added to team

### Test 3: Matching Email Flow
1. Login as `alice@example.com`
2. Click invite link for `alice@example.com`
3. Verify no warning appears
4. Verify green "Accept Invitation" button
5. Click to accept
6. Verify auto-redirects to team page

## Browser Examples

### Email Prefilling in Action

**Before:**
```
Login form: [Empty email field]
User has to type: alice@example.com
```

**After:**
```
Login form: [alice@example.com ✓]
User just enters password
```

### Email Mismatch Warning

**Authenticated as bob@example.com, invite for alice@example.com:**
```
┌────────────────────────────────────────┐
│ ⚠️ Email mismatch detected             │
│                                        │
│ You're signed in as bob@example.com   │
│ But invitation is for alice@example.com│
│                                        │
│ [Continue anyway] [Switch account]   │
└────────────────────────────────────────┘
```

## API Reference

### Get Invitation Info (Public)
```http
GET /teams/invitations/info/{token}

Response:
{
  "team_name": "Summer Vacation",
  "inviter_name": "John",
  "inviter_email": "john@example.com",
  "invitee_email": "alice@example.com",
  "created_at": "2024-12-08T10:00:00",
  "expires_at": "2024-12-15T10:00:00",
  "is_expired": false
}
```

### Accept Invitation (Authenticated)
```http
POST /teams/accept-invite/invite
Authorization: Bearer {token}

{
  "token": "{invitation_token}"
}

Response:
{
  "team_id": "uuid-team-id",
  "message": "Successfully joined team"
}
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Email not prefilling on signup | Check `?email=` param in URL and query params subscription |
| Email mismatch warning not showing | Verify `currentUserEmail` is set correctly after login |
| Token validation fails | Ensure token is complete and not corrupted in URL |
| Invitation shows as expired | Check server time sync and backend expiry config |

## Files Modified

1. `frontend/src/app/pages/invite-accept/invite-accept.page.ts` - Optimized component logic
2. `frontend/src/app/pages/invite-accept/invite-accept.page.html` - Enhanced UI with email prefilling
3. `frontend/src/app/pages/login/login.page.ts` - Added email param handling
4. `frontend/src/app/pages/signup/signup.page.ts` - Added email param handling
5. `frontend/src/app/services/auth.service.ts` - Added getCurrentUserEmail() and getCurrentUser()
6. `INVITATION_FLOW_GUIDE.md` - Comprehensive documentation

## Build Status

✅ **Build Successful** (523.22 kB)
- Main bundle: 466.55 kB
- Polyfills: 33.99 kB
- Styles: 21.56 kB
- Runtime: 1.13 kB

All TypeScript compilation successful with no errors.
