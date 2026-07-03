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
| `role` | User role (`Customer` by default) |

Tokens are signed with HMAC-SHA256 using the key from `appsettings.Development.json` (`Jwt:Key`).

Default expiry: **60 minutes** (`Jwt:ExpiresMinutes`).

### Password storage

Passwords are never stored in plain text. The backend uses ASP.NET Core's `PasswordHasher<User>` to hash passwords before saving to the `PasswordHash` column.

## User roles

| Role | Description |
|------|-------------|
| `Customer` | Default role assigned on registration |
| `Admin` | Intended for admin panel access (not yet enforced in API) |

New users always register as `Customer`. To create an admin user for testing, update the `Role` column directly in the database:

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
  role: string | null;
}
```

### Actions

| Action | When | Effect |
|--------|------|--------|
| `setCredentials(token)` | After login or register | Saves token, decodes JWT claims, persists to `localStorage` |
| `logout()` | User clicks logout (not yet wired) | Clears state and `localStorage` |

### Persistence

The token is stored in `localStorage` under the key `accessToken`. On page refresh, the Redux store rehydrates from `localStorage` so the user stays logged in.

### API requests

The axios instance (`src/api/api.ts`) adds the token to every request:

```
Authorization: Bearer <accessToken>
```

## Logout

There is no backend logout endpoint — this is normal for stateless JWTs. Logout is handled entirely on the frontend:

1. Dispatch `logout()` to clear Redux state
2. Remove token from `localStorage`

The token remains valid until it expires, but the frontend stops sending it.

## Protected vs public endpoints

| Endpoint | Auth required |
|----------|---------------|
| `POST /api/auth/register` | No |
| `POST /api/auth/login` | No |
| `GET /api/user` | No (should be protected in future) |
| `POST /api/appointments` | Yes |

Protected endpoints use the `[Authorize]` attribute. The backend reads the user ID from the JWT `sub` claim.

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

## Security notes (portfolio context)

- Never commit `appsettings.Development.json` — it is gitignored
- The JWT key should be a long random string in production
- There is no refresh token — users re-login after expiry
- There is no token blacklist — logout is client-side only
- User listing endpoint currently exposes password hashes (legacy, to be fixed)
