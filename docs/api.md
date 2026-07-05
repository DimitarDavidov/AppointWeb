# API Reference

Base URL: **http://localhost:8080**

All request and response bodies are JSON unless noted otherwise.

## Authentication endpoints

### Register

Create a new user account. Returns a JWT immediately (auto-login).

```
POST /api/auth/register
```

**Request body**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `email` | string | Required, valid email |
| `password` | string | Required, minimum 6 characters |

**Success response — `200 OK`**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `409 Conflict` | Email already registered |
| `400 Bad Request` | Validation failed |

---

### Login

Authenticate an existing user.

```
POST /api/auth/login
```

**Request body**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success response — `200 OK`**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Invalid email or password |

---

### Forgot password

Request a password reset link by email. Always returns the same response whether or not the email exists (prevents account enumeration).

Rate limited to **5 requests per IP per 15 minutes**.

```
POST /api/auth/forgot-password
```

**Request body**

```json
{
  "email": "user@example.com"
}
```

**Success response — `200 OK`**

```json
{
  "message": "If an account exists for this email, password reset instructions have been sent."
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | Validation failed (invalid email format) |
| `429 Too Many Requests` | Rate limit exceeded |

---

### Reset password

Set a new password using the token from the reset email link.

```
POST /api/auth/reset-password
```

**Request body**

```json
{
  "token": "token-from-email-link",
  "newPassword": "newpassword123"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `token` | string | Required, from `?token=` query param in reset email |
| `newPassword` | string | Required, minimum 6 characters |

**Success response — `200 OK`**

```json
{
  "message": "Password has been reset successfully."
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | Invalid or expired token, or validation failed |

**Business rules**

- Reset tokens expire after **1 hour**
- Each token can only be used **once**
- Requesting a new reset invalidates previous unused tokens for that user
- Only the token hash is stored in the database — the raw token is sent by email only

---

## User endpoints

### List providers

Returns users with the `Provider` role. Requires authentication. Only `id` and `username` are returned — no sensitive fields.

```
GET /api/user/providers
Authorization: Bearer <accessToken>
```

**Success response — `200 OK`**

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "username": "jane-provider"
  }
]
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid JWT |

---

## Appointment endpoints

### Create appointment

Requires authentication. The customer ID is taken from the JWT — not from the request body.

```
POST /api/appointments
Authorization: Bearer <accessToken>
```

**Request body**

```json
{
  "providerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "serviceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "startTime": "2026-06-15T10:00:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `providerId` | Guid | User who provides the service |
| `serviceId` | Guid | Service being booked |
| `startTime` | DateTime | Appointment start (UTC recommended) |

**Success response — `200 OK`**

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "providerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "serviceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "startTime": "2026-06-15T10:00:00Z",
  "endTime": "2026-06-15T10:30:00Z",
  "status": "Booked",
  "priceAtBooking": 25.00
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid JWT |
| `400 Bad Request` | Start time is in the past |
| `404 Not Found` | Service or provider not found |
| `409 Conflict` | Time slot already booked (double-booking) |

**Business rules**

- `endTime` is calculated automatically from the service duration
- Only active services (`IsActive = true`) can be booked
- A PostgreSQL exclusion constraint prevents overlapping bookings for the same provider

---

## Using JWT in requests

Include the token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

The frontend axios client attaches this automatically when a token exists in `localStorage`.

## Example workflow with curl

```bash
# 1. Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"password123\"}"

# 2. Request password reset
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\"}"

# 3. Reset password with token from email
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"TOKEN_FROM_EMAIL\",\"newPassword\":\"newpassword123\"}"

# 4. Save the accessToken from login, then create an appointment
curl -X POST http://localhost:8080/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"providerId\":\"PROVIDER_GUID\",\"serviceId\":\"SERVICE_GUID\",\"startTime\":\"2026-06-15T10:00:00Z\"}"
```
