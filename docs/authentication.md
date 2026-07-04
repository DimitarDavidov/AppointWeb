# Authentication

AppointWeb uses **JWT (JSON Web Tokens)** for stateless authentication. There are no server-side sessions — the token itself proves identity.

## How it works

```
Register/Login → Backend validates credentials → JWT + user info returned
                                                          │
Frontend stores token & user info in Redux + localStorage ◄┘
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
| `role` | User role (`Customer` by default) |

Tokens are signed with HMAC-SHA256 using the key from `appsettings.Development.json` (`Jwt:Key`).

Default expiry: **60 minutes** (`Jwt:ExpiresMinutes`).

### API response

Both `/api/auth/register` and `/api/auth/login` return:

```json
{
  "accessToken": "eyJhbG...",
  "username": "johndoe",
  "email": "john@example.com",
  "role": "Customer"
}
```

The frontend stores this full response — not just the token — so username and role are available immediately without decoding the JWT.

### Password storage

Passwords are never stored in plain text. The backend uses ASP.NET Core's `PasswordHasher<User>` to hash passwords before saving to the `PasswordHash` column.

## Registration

Registration requires a **username**, **email**, and **password**:

| Field | Rules |
|-------|-------|
| `username` | Required, 3–50 characters, unique (stored lowercase) |
| `email` | Required, valid email, unique |
| `password` | Required, minimum 6 characters |

On success the user is automatically logged in (JWT returned immediately).

## User roles

| Role | Description |
|------|-------------|
| `Customer` | Default role assigned on registration |
| `Admin` | Shown **Admin Panel** link in navbar dropdown |

New users always register as `Customer`. To create an admin user for testing, update the `Role` column directly in the database:

```sql
UPDATE "Users" SET "Role" = 'Admin' WHERE "Email" = 'admin@example.com';
```

The frontend checks `role === "Admin"` to show the Admin Panel menu item. API-side role enforcement is not yet implemented.

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
| `setCredentials(response)` | After login or register | Saves token + user info to Redux and `localStorage` |
| `logout()` | User clicks Logout in navbar | Clears Redux state and `localStorage` |

### Persistence

Two keys are used in `localStorage`:

| Key | Contents |
|-----|----------|
| `accessToken` | JWT string (used by axios interceptor) |
| `authUser` | JSON with `username`, `email`, `role`, `userId` |

On page refresh, the Redux store rehydrates from both keys so the user stays logged in.

### API requests

The axios instance (`src/api/api.ts`) adds the token to every request:

```
Authorization: Bearer <accessToken>
```

## Logout

There is no backend logout endpoint — this is normal for stateless JWTs. Logout is handled entirely on the frontend via the navbar dropdown:

1. User clicks **Logout**
2. `dispatch(logout())` clears Redux state
3. `accessToken` and `authUser` are removed from `localStorage`
4. User is redirected to `/`

The token remains valid until it expires, but the frontend stops sending it.

## Protected vs public endpoints

| Endpoint | Auth required |
|----------|---------------|
| `POST /api/auth/register` | No |
| `POST /api/auth/login` | No |
| `GET /api/user` | Yes |
| `GET /api/user/{id}` | Yes |
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
- Frontend routes (`/admin`, `/account`, etc.) are not yet protected by route guards
