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
  "username": "johndoe",
  "email": "user@example.com",
  "password": "password123"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `username` | string | Required, 3–50 characters, must be unique |
| `email` | string | Required, valid email, must be unique |
| `password` | string | Required, minimum 6 characters |

**Success response — `200 OK`**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "username": "johndoe",
  "email": "user@example.com",
  "role": "Customer"
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `409 Conflict` | Email already registered |
| `409 Conflict` | Username already taken |
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
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "username": "johndoe",
  "email": "user@example.com",
  "role": "Customer"
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Invalid email or password |

---

## Auth response fields

Both register and login return the same `AuthResponse` shape:

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | string | JWT for authenticated requests |
| `username` | string | User's unique username |
| `email` | string | User's email address |
| `role` | string | User role (`Customer` or `Admin`) |

## User endpoints

> **Note:** These endpoints are currently unprotected and return the full user model including `passwordHash`. This will be secured in a future update.

### List all users

```
GET /api/user
```

**Success response — `200 OK`**

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "username": "johndoe",
    "passwordHash": "...",
    "role": "Customer",
    "createdAt": "2026-02-20T19:00:00Z"
  }
]
```

---

### Get user by ID

```
GET /api/user/{id}
```

**Success response — `200 OK`** — single user object

**Error responses**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | User does not exist |

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
  -d "{\"username\":\"johndoe\",\"email\":\"user@example.com\",\"password\":\"password123\"}"

# 2. Save the accessToken from the response, then create an appointment
curl -X POST http://localhost:8080/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"providerId\":\"PROVIDER_GUID\",\"serviceId\":\"SERVICE_GUID\",\"startTime\":\"2026-06-15T10:00:00Z\"}"
```
