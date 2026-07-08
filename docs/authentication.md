# Authentication

AppointWeb uses **JWT (JSON Web Tokens)** for stateless authentication. There are no server-side sessions — the token itself proves identity.

## How it works

```
Register/Login → Backend validates credentials → JWT issued → Frontend stores token
                                                                      │
Protected API request ← Backend validates JWT ← Authorization header ◄┘
```

### Token contents

When a user registers or logs in, the backend creates a JWT containing:

| Claim | Value |
|-------|-------|
| `sub` | User ID (Guid) |
| `email` | User email |
| `unique_name` | Username |
| `role` | User role (`Customer`, `Provider`, or `Admin`) |

Tokens are signed with HMAC-SHA256 using the key from `appsettings.Development.json` (`Jwt:Key`).

Default expiry: **60 minutes** (`Jwt:ExpiresMinutes`).

### Auth response

Login and register return:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "username": "jane",
  "email": "jane@example.com",
  "role": "Customer"
}
```

### Password storage

Passwords are never stored in plain text. The backend uses ASP.NET Core's `PasswordHasher<User>` to hash passwords before saving to the `PasswordHash` column.

## User roles

| Role | Description |
|------|-------------|
| `Customer` | Default role; can browse and book services |
| `Provider` | Can manage services, availability, and incoming bookings |
| `Admin` | Can manage all users via the admin panel and API |

### Registration roles

Users can register as **Customer** (default) or **Provider** by passing an optional `role` field. **Admin** cannot be self-assigned — set it manually in the database:

```sql
UPDATE "Users" SET "Role" = 'Admin' WHERE "Email" = 'admin@example.com';
```

## Frontend auth state

Auth state is managed with **Redux Toolkit** in `src/features/auth/authSlice.ts`.

### State shape

```typescript
{
  accessToken: string | null;
  userId: string | null;
  email: string | null;
  username: string | null;
  role: string | null;
}
```

### Actions

| Action | When | Effect |
|--------|------|--------|
| `setCredentials(response)` | After login or register | Saves token and profile, persists to `localStorage` |
| `logout()` | User clicks logout | Clears state and `localStorage` |
| `updateProfile(partial)` | After account email/username change | Updates stored profile fields |

### Persistence

The token is stored in `localStorage` under `accessToken`. Profile fields are stored under `authUser`. On page refresh, the Redux store rehydrates from `localStorage` so the user stays logged in.

### API requests

The axios instance (`src/api/api.ts`) adds the token to every request:

```
Authorization: Bearer <accessToken>
```

## Route protection

The `ProtectedRoute` component guards frontend routes:

- Redirects unauthenticated users to `/login` (preserving the intended destination)
- Redirects authenticated users without the required role to `/`

Role requirements are defined per route in `App.tsx`.

## Logout

There is no backend logout endpoint — this is normal for stateless JWTs. Logout is handled entirely on the frontend:

1. Dispatch `logout()` to clear Redux state
2. Remove token and profile from `localStorage`

The token remains valid until it expires, but the frontend stops sending it.

## Suspended accounts

When an admin suspends a user, `IsSuspended` is set to `true` on the user record. The `SuspendedUserMiddleware` blocks all authenticated API requests for suspended accounts with `403 Forbidden`.

Suspended users also cannot log in — the login endpoint returns `401 Unauthorized`.

## Password reset

Users can reset their password via email without being logged in.

```
Forgot password form → POST /api/auth/forgot-password
                              │
                              ▼
                    Token saved (hashed) + email sent
                              │
                              ▼
              User clicks link → /reset-password?token=...
                              │
                              ▼
                    POST /api/auth/reset-password
```

### Security behaviour

- **No email enumeration** — forgot-password always returns the same success message
- **Rate limiting** — 5 forgot-password requests per IP per 15 minutes
- **Hashed tokens** — only SHA-256 hash stored in `PasswordResetTokens`
- **1-hour expiry**, single use, old unused tokens invalidated on new request
- **Email failure rollback** — if SMTP fails, the token is removed so no orphaned reset links exist
- Existing JWTs remain valid until expiry after a password reset (no server-side session invalidation)

### Email delivery

| Mode | When | Behaviour |
|------|------|-----------|
| `LoggingEmailService` | `Email:Host` is empty | Email content logged to the console |
| `SmtpEmailService` | SMTP configured | HTML + plain-text email via MailKit |

All emails use branded HTML templates. Links use `{Frontend:BaseUrl}` (for example `http://localhost:5173`).

| Trigger | Recipient | Purpose |
|---------|-----------|---------|
| `POST /api/auth/forgot-password` | User | Password reset link |
| `POST /api/appointments` | Provider | New booking request to review |
| `PATCH /api/appointments/{id}/confirm` | Customer | Appointment confirmed |
| `PATCH /api/appointments/{id}/cancel` | Other party | Appointment cancelled |
| `PATCH /api/appointments/{id}/reschedule` | Other party | Reschedule proposal to review |
| `PATCH /api/appointments/{id}/reschedule/accept` | Requester | Reschedule accepted |

Email send failures on appointment actions are logged but do not roll back the API operation (except password reset, where a failed send removes the token).

### In-app notifications

Stored in the `Notifications` table and surfaced in the navbar bell. Created by `NotificationService` when appointment events occur.

| Trigger | Recipient | Type |
|---------|-----------|------|
| `PATCH /api/appointments/{id}/confirm` | Customer | `AppointmentConfirmed` |
| `PATCH /api/appointments/{id}/cancel` | Other party | `AppointmentCancelled` |
| `PATCH /api/appointments/{id}/reschedule` | Other party | `RescheduleReceived` |
| `PATCH /api/appointments/{id}/reschedule/accept` | Requester | `RescheduleAccepted` |

The frontend polls `GET /api/notifications/unread-count` every 30 seconds while logged in. Notification creation failures are logged but do not roll back the appointment action.

## Protected vs public endpoints

| Endpoint group | Auth required | Role |
|----------------|---------------|------|
| `POST /api/auth/*` | No | — |
| `GET /api/catalog` | No | — |
| `GET /api/account` | Yes | Any |
| `PATCH /api/account/*` | Yes | Any |
| `DELETE /api/account` | Yes | Any |
| `GET /api/appointments` | Yes | Any (scoped by role) |
| `POST /api/appointments` | Yes | Any |
| `GET /api/notifications` | Yes | Any |
| `PATCH /api/notifications/*` | Yes | Any |
| `GET /api/provider/*` | Yes | Provider |
| `GET /api/admin/*` | Yes | Admin |

Protected endpoints use the `[Authorize]` attribute (with optional role restrictions). The backend reads the user ID from the JWT `sub` claim.

## Configuration

JWT settings in `appsettings.Development.json`:

```json
{
  "Jwt": {
    "Key": "your-super-secret-jwt-key-at-least-32-characters-long",
    "Issuer": "AppointWeb",
    "Audience": "AppointWeb",
    "ExpiresMinutes": "60"
  }
}
```

| Setting | Purpose |
|---------|---------|
| `Key` | Secret used to sign tokens (min 32 characters) |
| `Issuer` | Who created the token |
| `Audience` | Who the token is intended for |
| `ExpiresMinutes` | Token lifetime |

Email and frontend settings for transactional emails (password reset, appointment notifications):

```json
{
  "Email": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "Username": "your-gmail@gmail.com",
    "Password": "your-gmail-app-password",
    "FromAddress": "your-gmail@gmail.com",
    "FromName": "AppointWeb",
    "UseSsl": true
  },
  "Frontend": {
    "BaseUrl": "http://localhost:5173"
  }
}
```

See `appsettings.Development.example.json` for the full template.

## Security notes (portfolio context)

- Never commit `appsettings.Development.json` — it is gitignored
- The JWT key should be a long random string in production
- There is no refresh token — users re-login after expiry
- There is no token blacklist — logout is client-side only
