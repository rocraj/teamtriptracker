# Team Invitation Flow - Complete Guide

## Overview

The TeamTripTracker application has an optimized invitation system that allows team creators to invite members via email. The flow has been enhanced to prefill emails, handle edge cases, and provide a seamless user experience across unauthenticated and authenticated states.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     INVITATION FLOW                         │
└─────────────────────────────────────────────────────────────┘

1. INVITATION CREATION
   └─→ Team creator sends invitation via bulk invite endpoint
   └─→ Backend generates unique JWT token for each invitee email
   └─→ Email link sent: /invite/{token}

2. USER CLICKS LINK
   └─→ Route: /invite/:token
   └─→ Component: invite-accept.page.ts loads
   └─→ Token validated via backend API

3. USER STATE DETECTION
   ├─→ AUTHENTICATED & EMAIL MATCHES
   │  └─→ Show "Accept Invitation" button (direct accept)
   │
   ├─→ AUTHENTICATED & EMAIL MISMATCH
   │  └─→ Show warning about email mismatch
   │  └─→ Options: Continue Anyway OR Switch Account
   │
   └─→ NOT AUTHENTICATED
      └─→ Show Sign In & Create Account buttons
      └─→ Both pre-fill the invitee email

4. ACCEPTANCE
   └─→ POST /teams/accept-invite/invite with token
   └─→ Backend adds user to team
   └─→ Redirect to team detail page
```

## Component Details

### 1. invite-accept.page.ts

**Key Features:**
- Token validation and retrieval
- User authentication state detection
- Email matching for authenticated users
- Graceful error handling
- Pre-filled email data

**Critical Properties:**

```typescript
// Token management
token: string | null = null;
tokenValid: boolean = false;

// Invitation data - strongly typed
invitationInfo: InvitationData | null = null;
inviteeEmail: string = '';

// Authentication state
isAuthenticated: boolean = false;
currentUserEmail: string | null = null;

// UX states
emailMatchConfirmed: boolean = false;
showEmailConfirmation: boolean = false;
```

**Key Methods:**

```typescript
/**
 * Loads invitation info from backend
 * Validates token and retrieves team/inviter details
 */
loadInvitationInfo(): void {
  // Calls: /teams/invitations/info/{token}
  // Public endpoint - no auth required
  // Returns: team_name, inviter details, invitee email, expiry
}

/**
 * Accept invitation with user validation
 * - If authenticated & email matches: direct accept
 * - If authenticated & email mismatch: requires confirmation
 * - If not authenticated: requires login/signup first
 */
acceptInvitation(): void {
  // Validates email match requirement
  // Calls: POST /teams/accept-invite/invite
  // Redirects to team detail page on success
}

/**
 * Handle email mismatch by switching to correct account
 * Preserves invitation token and passes correct email
 */
switchAccount(): void {
  // Routes to /signup with invitation token + email params
  // Allows user to create new account with correct email
}

/**
 * Calculate human-readable expiry time
 */
getTimeUntilExpiry(): string {
  // Returns "X hours" or "less than 1 hour"
  // Helps user understand urgency
}
```

### 2. invite-accept.page.html

**UI States:**

1. **Loading State**
   - Spinner animation
   - "Validating invitation..." message
   - Triggered while fetching invitation data

2. **Error State**
   - Red error box with details
   - Back to Login button for recovery
   - Clear error messaging

3. **Valid Invitation - Authenticated & Email Matches**
   - Green "Accept Invitation" button
   - Direct acceptance flow
   - Team, inviter, and invitee information displayed

4. **Valid Invitation - Authenticated & Email Mismatch**
   - Yellow warning box
   - Two options:
     - "Continue anyway" → Accept for mismatched email
     - "Switch account" → Route to signup with correct email
   - Helpful messaging about the mismatch

5. **Valid Invitation - Not Authenticated**
   - Sign In button → Route to /login with email & token
   - Create Account button → Route to /signup with email & token
   - Both pre-fill the invitee email

**Key UI Features:**

```html
<!-- Prefilled email display with icon -->
<div class="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4">
  <p class="text-sm text-gray-600 mb-1">📧 Invitation sent to</p>
  <p class="text-lg font-semibold text-gray-900 break-all">{{ inviteeEmail }}</p>
  <p class="text-xs text-amber-700 mt-2">
    ℹ️ Use this email to sign up or log in to accept the invitation
  </p>
</div>

<!-- Email mismatch warning with action buttons -->
<div *ngIf="isAuthenticated && !emailMatches() && !showEmailConfirmation"
     class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
  <p class="text-sm font-semibold text-yellow-900 mb-2">⚠️ Email mismatch detected</p>
  <p class="text-xs text-yellow-700 mb-3">
    You're signed in as <strong>{{ currentUserEmail }}</strong>, 
    but this invitation is for <strong>{{ inviteeEmail }}</strong>
  </p>
  <!-- Action buttons with user choice -->
</div>

<!-- Expiry information with time remaining -->
<span *ngIf="!invitationInfo.is_expired" class="text-green-600">
  ✓ Expires in {{ getTimeUntilExpiry() }}
</span>
```

### 3. Login & Signup Pages - Enhanced

**Query Parameters Support:**

```typescript
// Both login.page.ts and signup.page.ts now handle:
this.route.queryParams.subscribe(params => {
  // Email parameter - for prefilling from invite-accept
  if (params['email']) {
    this.email = params['email'];
  }

  // Invitation token - for auto-accepting after login/signup
  if (params['invite']) {
    this.invitationToken = params['invite'];
    this.loadInvitationInfo();
  }
});
```

**Flow Examples:**

1. **User clicks invite link, is not authenticated:**
   ```
   /invite/{token}
   → invite-accept detects not authenticated
   → User clicks "Sign In to Accept"
   → Route: /login?invite={token}&email={invitee_email}
   → Login page prefills email and loads invitation info
   → After successful login: auto-accepts invitation
   → Redirects to team detail page
   ```

2. **User clicks invite link, is authenticated with different email:**
   ```
   /invite/{token}
   → invite-accept detects auth + email mismatch
   → User clicks "Switch account"
   → Route: /signup?invite={token}&email={invitee_email}
   → Signup page prefills email
   → After successful signup: auto-accepts invitation
   → Redirects to team detail page
   ```

### 4. AuthService Enhancement

**New Methods Added:**

```typescript
/**
 * Get the email of the currently authenticated user
 * Returns null if no user is authenticated
 */
getCurrentUserEmail(): string | null {
  const currentUser = this.currentUserSubject.value;
  return currentUser?.email || null;
}

/**
 * Get the current user object
 */
getCurrentUser(): User | null {
  return this.currentUserSubject.value;
}
```

## Backend API Endpoints

### 1. Get Invitation Info (Public)

```http
GET /teams/invitations/info/{token}
```

**No authentication required**

**Response:**
```json
{
  "team_name": "Summer Vacation 2024",
  "inviter_name": "John Doe",
  "inviter_email": "john@example.com",
  "invitee_email": "alice@example.com",
  "created_at": "2024-12-08T10:30:00",
  "expires_at": "2024-12-15T10:30:00",
  "is_expired": false
}
```

### 2. Accept Invitation (Authenticated)

```http
POST /teams/accept-invite/invite
Content-Type: application/json
Authorization: Bearer {token}

{
  "token": "{invitation_token}"
}
```

**Response:**
```json
{
  "team_id": "uuid-team-id",
  "message": "Successfully joined team"
}
```

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid or expired invitation token" | Token invalid/expired | Show error, offer to resend |
| "Invitation has already been used" | Already accepted | Explain already member |
| "Team not found" | Team deleted | Show error, offer dashboard redirect |
| "Email mismatch" | User logged in with wrong email | Offer to switch accounts |
| "Unauthorized" | Not authenticated when required | Redirect to login/signup |

### Error State Flow

```typescript
loadInvitationInfo(): void {
  this.invitationService.getInvitationInfo(this.token).subscribe(
    (info) => {
      this.invitationInfo = info;
      this.tokenValid = true;
      // Check for email mismatch
      if (this.isAuthenticated && this.currentUserEmail !== this.inviteeEmail) {
        this.showEmailConfirmation = true;
      }
      this.loading = false;
    },
    (error) => {
      this.error = getErrorMessage(error);
      this.tokenValid = false;
      this.loading = false;
      // Render error state UI
    }
  );
}
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ User clicks email link: /invite/{token}                      │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ invite-accept.page.ts: ngOnInit()                            │
│ • Extract token from route params                            │
│ • Check if user is authenticated                             │
│ • Load invitation info                                       │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ invitationService.getInvitationInfo(token)                   │
│ GET /teams/invitations/info/{token}                          │
│ Returns: team name, inviter, invitee email, expiry           │
└──────────────────────────────────────────────────────────────┘
                          ↓
                   ┌──────┴──────┐
                   ↓             ↓
            ┌──────────────┐  ┌─────────────────┐
            │   Valid      │  │    Invalid      │
            │ Invitation   │  │  (Error State)  │
            └──────────────┘  └─────────────────┘
                   ↓
            ┌──────┴──────────────────┐
            ↓                         ↓
      ┌──────────────┐        ┌──────────────────┐
      │ Authenticated│        │  Not Authenticated│
      │   User       │        │      (No Token)   │
      └──────────────┘        └──────────────────┘
            ↓                         ↓
      ┌─────┴─────┐           ┌──────┴──────┐
      ↓           ↓           ↓             ↓
  ┌────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
  │Email   │ │Email     │ │Login    │ │Signup    │
  │Matches │ │Mismatch  │ │Button   │ │Button    │
  │        │ │          │ │         │ │          │
  │Accept  │ │Confirm or│ │Prefill  │ │Prefill   │
  │Direct  │ │Switch Ac │ │Email &  │ │Email &   │
  │        │ │          │ │Token    │ │Token     │
  └────────┘ └──────────┘ └─────────┘ └──────────┘
      ↓           ↓           ↓             ↓
  ┌──────────────────────────────────────────────┐
  │ POST /teams/accept-invite/invite             │
  │ (After login/signup if not authenticated)    │
  └──────────────────────────────────────────────┘
                    ↓
  ┌──────────────────────────────────────────────┐
  │ Success: Redirect to /teams/{team_id}        │
  │ Error: Show error message, allow retry       │
  └──────────────────────────────────────────────┘
```

## Implementation Examples

### Example 1: New User Receiving Invitation

```
Scenario: alice@example.com receives invite from john@example.com

1. Invitation Email Sent
   └─→ Subject: "John Doe invited you to join Summer Vacation 2024"
   └─→ Link: https://teamtriptracker.com/invite/eyJhbGciOiJIUzI1NiIsInR...

2. Alice Clicks Link
   └─→ Route: /invite/{token}
   └─→ Token validated
   └─→ Shows: "You're invited! 🎉"
   └─→ Team: "Summer Vacation 2024"
   └─→ From: "John Doe <john@example.com>"
   └─→ Email: alice@example.com (prefilled, highlighted)
   └─→ Status: Not authenticated

3. Alice Chooses Action
   └─→ Clicks "Create Account to Accept"
   └─→ Routes to: /signup?invite={token}&email=alice@example.com
   └─→ Signup form pre-fills: Email = alice@example.com

4. Alice Completes Signup
   └─→ Enters: name, password
   └─→ Email auto-filled: alice@example.com
   └─→ Clicks "Create Account to Accept"
   └─→ Backend creates user + accepts invitation
   └─→ Redirects to: /teams/{summer-vacation-team-id}

5. Alice Joins Team
   └─→ Sees team members: John + Alice
   └─→ Can view team expenses and expenses
```

### Example 2: Existing User with Wrong Email

```
Scenario: bob@example.com is logged in, clicks invite for bob.personal@example.com

1. Bob Logged In
   └─→ currentUserEmail = "bob@example.com"

2. Clicks Invite Link
   └─→ Route: /invite/{token}
   └─→ Invitation Email: bob.personal@example.com
   └─→ Component detects: Authenticated + Email Mismatch

3. Warning Dialog Shows
   └─→ "⚠️ Email mismatch detected"
   └─→ "You're signed in as bob@example.com"
   └─→ "But invitation is for bob.personal@example.com"
   └─→ Options:
       ├─→ "Continue anyway" (use current account)
       └─→ "Switch account" (create/use different account)

4. Bob Clicks "Switch Account"
   └─→ Routes to: /signup?invite={token}&email=bob.personal@example.com
   └─→ Form shows: Email = bob.personal@example.com (prefilled)
   └─→ Bob signs up with personal email
   └─→ Auto-accepts invitation
   └─→ Redirects to team

5. Bob Now Has Both Accounts
   └─→ bob@example.com (primary)
   └─→ bob.personal@example.com (in team)
```

### Example 3: Email Prefilling Across Route Navigation

```typescript
// From invite-accept.page.ts
goToSignup(): void {
  this.router.navigate(['/signup'], {
    queryParams: { 
      invite: this.token,           // For auto-accept after signup
      email: this.inviteeEmail      // For prefilling
    }
  });
}

// In signup.page.ts
ngOnInit(): void {
  this.route.queryParams.subscribe(params => {
    if (params['email']) {
      this.email = params['email'];  // Prefill immediately
    }
    if (params['invite']) {
      this.invitationToken = params['invite'];
      this.loadInvitationInfo();
    }
  });
}
```

## Key Features Summary

✅ **Email Prefilling**
- Automatically fills email field on login/signup pages
- Derived from invitation token
- Prevents typos and confusion

✅ **Smart State Detection**
- Detects user authentication status
- Validates email match for authenticated users
- Provides appropriate UI for each state

✅ **Graceful Error Handling**
- Clear error messages for invalid/expired tokens
- User guidance for recovery actions
- Error state with recovery options

✅ **Seamless Flow**
- Direct acceptance for matching emails
- One-click signup/login with prefilled data
- Auto-acceptance after login/signup
- Redirects to team immediately

✅ **Security**
- Token validation on backend
- User authorization checks
- No sensitive data in URL (only JWT token)
- Email verification through token content

✅ **User Experience**
- Real-time email mismatch detection
- Clear messaging about invitation status
- Expiry countdown to show urgency
- Easy account switching for email mismatches

## Testing Checklist

- [ ] Test with valid invitation token
- [ ] Test with invalid/expired token
- [ ] Test unauthenticated user flow (signup)
- [ ] Test authenticated user with matching email
- [ ] Test authenticated user with mismatched email
- [ ] Test "Switch account" flow
- [ ] Test email prefilling in login page
- [ ] Test email prefilling in signup page
- [ ] Test auto-acceptance after signup
- [ ] Test redirect to team detail page
- [ ] Test error messages and recovery
- [ ] Test on mobile/responsive layout

## Troubleshooting

**Issue: Email not prefilling on signup page**
- Check query params are being passed: `?email=user@example.com&invite={token}`
- Verify signup.page.ts subscribes to route.queryParams
- Check that email assignment happens before form renders

**Issue: User can't accept with mismatched email**
- Click "Continue anyway" button instead
- Or use "Switch account" to create account with correct email
- Never force a single email per account

**Issue: Invitation shows as expired immediately**
- Check backend token expiry configuration
- Verify server time synchronization
- Check expires_at in response is valid date format

**Issue: Token validation fails**
- Ensure token is copied completely from email link
- Check token hasn't been URL-encoded incorrectly
- Verify backend secret key for JWT validation
