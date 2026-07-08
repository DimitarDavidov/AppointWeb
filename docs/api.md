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
  "username": "jane",
  "email": "user@example.com",
  "password": "password123",
  "phoneNumber": "+1234567890",
  "role": "Customer"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `username` | string | Required, 3–50 characters, unique |
| `email` | string | Required, valid email, unique |
| `password` | string | Required, minimum 6 characters |
| `phoneNumber` | string | Optional |
| `role` | string | Optional. `Customer` (default) or `Provider`. Admin cannot be self-assigned |

**Success response — `200 OK`**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "username": "jane",
  "email": "user@example.com",
  "role": "Customer"
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `409 Conflict` | Email or username already registered |
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
  "username": "jane",
  "email": "user@example.com",
  "role": "Customer"
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Invalid email or password, or account suspended |

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

## Catalog endpoints

### List offerings

Returns all active provider–service pairings for the public catalog. No authentication required.

```
GET /api/catalog
```

**Success response — `200 OK`**

```json
[
  {
    "providerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "providerUsername": "jane-provider",
    "serviceId": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
    "serviceName": "Dental Checkup",
    "description": "Routine dental examination",
    "category": "Healthcare & Dental",
    "country": "United States",
    "city": "New York",
    "durationMinutes": 30,
    "price": 25.00
  }
]
```

---

### Get offering

Returns a single catalog offering by provider and service ID.

```
GET /api/catalog/{providerId}/{serviceId}
```

**Success response — `200 OK`** — Same shape as a single item from the list above.

**Error responses**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Offering not found or inactive |

---

## Service endpoints

### List services

Returns all active services. No authentication required.

```
GET /api/services
```

### Get service by ID

```
GET /api/services/{id}
```

---

## User endpoints

### List providers

Returns users with the `Provider` role. Only `id` and `username` are returned.

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

---

## Appointment endpoints

All appointment endpoints require authentication.

**Listing scope**

| Role | Endpoint | What is returned |
|------|----------|-------------------|
| Customer | `GET /api/appointments` | Appointments the user booked as a customer |
| Admin | `GET /api/appointments` | All appointments |
| Provider | `GET /api/provider/appointments` | Appointments where the user is the provider |

Providers should use `/api/provider/appointments` for their dashboard. The general `/api/appointments` endpoint only returns rows where the authenticated user is the **customer** (unless the user is an admin).

### Appointment status values

| Status | Meaning |
|--------|---------|
| `Pending` | Awaiting provider confirmation, or a reschedule request is in progress |
| `Booked` | Confirmed and scheduled |
| `Cancelled` | Cancelled by customer, provider, or admin |
| `Completed` | Appointment took place |
| `NoShow` | Customer did not attend |

### List appointments (customer / admin)

```
GET /api/appointments
Authorization: Bearer <accessToken>
```

**Success response — `200 OK`**

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
    "customerUsername": "john",
    "customerPhoneNumber": "+1234567890",
    "providerId": "3fa85f64-5717-4562-b3fc-2c963f66afa8",
    "providerUsername": "jane-provider",
    "serviceId": "3fa85f64-5717-4562-b3fc-2c963f66afa9",
    "serviceName": "Dental Checkup",
    "startTime": "2026-06-15T10:00:00Z",
    "endTime": "2026-06-15T10:30:00Z",
    "createdAt": "2026-06-01T08:00:00Z",
    "status": "Booked",
    "priceAtBooking": 25.00,
    "cancellationReason": null,
    "cancelledByUserId": null,
    "pendingRescheduleStartTime": null,
    "pendingRescheduleEndTime": null,
    "rescheduleReason": null,
    "rescheduleRequestedByUserId": null,
    "providerRescheduleCount": 0,
    "customerRescheduleCount": 0,
    "previousStartTime": null
  }
]
```

---

### Get appointment by ID

```
GET /api/appointments/{id}
Authorization: Bearer <accessToken>
```

Returns a single appointment if the user has access. `404` if not found or not accessible.

---

### Create appointment

The customer ID is taken from the JWT — not from the request body.

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
  "status": "Pending",
  "priceAtBooking": 25.00
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid JWT |
| `400 Bad Request` | Start time in the past, self-booking, provider doesn't offer service, or outside availability |
| `404 Not Found` | Service or provider not found |
| `409 Conflict` | Time slot already booked (double-booking) |

**Business rules**

- Users **cannot book their own services** (`customerId` must differ from `providerId`)
- New appointments are created with status **`Pending`** until the provider confirms
- The provider receives an email notification when a booking is requested
- `endTime` is calculated automatically from the service duration
- Only active services (`IsActive = true`) linked via `ProviderServices` can be booked
- Booking must fall within the provider's availability windows (if configured)
- Overlapping `Booked` or `Pending` appointments for the same provider are blocked by application logic and a PostgreSQL exclusion constraint

---

### Confirm appointment

Provider or admin confirms a pending booking.

```
PATCH /api/appointments/{id}/confirm
Authorization: Bearer <accessToken>
```

**Success response — `200 OK`** — Returns the updated appointment with status `Booked`.

**Error responses**

| Status | Condition |
|--------|-----------|
| `403 Forbidden` | Caller is not the provider (unless admin) |
| `400 Bad Request` | Appointment is not in `Pending` status |
| `409 Conflict` | Time slot is no longer available |

---

### Cancel appointment

```
PATCH /api/appointments/{id}/cancel
Authorization: Bearer <accessToken>
```

Cancels a `Pending` or `Booked` appointment. Accessible by the customer, provider, or admin.

**Request body** (optional)

```json
{
  "reason": "Schedule conflict"
}
```

The API records `cancelledByUserId` from the authenticated user. The other party is notified by email.

**Success response — `200 OK`** — Returns the updated appointment with status `Cancelled`.

**Error responses**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Appointment not found |
| `403 Forbidden` | User does not have access |
| `400 Bad Request` | Appointment is not in a cancellable status (`Pending` or `Booked`) |

---

### Request reschedule

Proposes a new time. Creates a pending reschedule request that the other party must accept.

```
PATCH /api/appointments/{id}/reschedule
Authorization: Bearer <accessToken>
```

**Request body**

```json
{
  "startTime": "2026-06-16T14:00:00Z",
  "reason": "Running late that day"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `startTime` | DateTime | Required, must differ from the current start time |
| `reason` | string | Required when the **provider** requests a reschedule; optional for customers |

**Business rules**

- Sets `pendingRescheduleStartTime`, `pendingRescheduleEndTime`, `rescheduleReason`, and `rescheduleRequestedByUserId`
- Sets status to **`Pending`** while the request is open
- Sends an email to the other party
- If the appointment had never been confirmed, accepting the request updates the time but does **not** increment reschedule counts

**Error responses**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Appointment not found |
| `403 Forbidden` | User does not have access |
| `400 Bad Request` | Invalid time, inactive service, outside availability, or missing reason (provider) |
| `409 Conflict` | New time slot already booked |

---

### Accept reschedule

Accepts a pending reschedule request from the other party.

```
PATCH /api/appointments/{id}/reschedule/accept
Authorization: Bearer <accessToken>
```

**Success response — `200 OK`** — Returns the updated appointment with status `Booked` and the new time applied.

**Error responses**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | No pending reschedule, or you requested the reschedule yourself |
| `409 Conflict` | Proposed slot is no longer available |

---

### Update appointment outcome

Mark a finished appointment as completed or no-show.

```
PATCH /api/appointments/{id}/status
Authorization: Bearer <accessToken>
```

**Request body**

```json
{
  "status": "Completed"
}
```

Allowed values: `Completed`, `NoShow`. Only **confirmed** (`Booked`) appointments whose end time is in the past can be updated.

---

## Account endpoints

All require authentication.

### Get profile

```
GET /api/account
Authorization: Bearer <accessToken>
```

### Update email

```
PATCH /api/account/email
```

Returns a new JWT (email claim changes).

### Update username

```
PATCH /api/account/username
```

Returns a new JWT (username claim changes).

### Change password

```
PATCH /api/account/password
```

### Update phone number

```
PATCH /api/account/phone-number
```

### Delete account

```
DELETE /api/account
```

Permanently deletes the authenticated user's account and related data.

---

## Provider endpoints

Require the `Provider` or `Admin` role.

### List provider appointments

Returns appointments where the authenticated user is the provider.

```
GET /api/provider/appointments
Authorization: Bearer <accessToken>
```

**Success response — `200 OK`** — Same shape as `GET /api/appointments` (see [List appointments](#list-appointments-customer--admin)).

---

### List services

Returns only the authenticated provider's active service listings.

```
GET /api/provider/services
Authorization: Bearer <accessToken>
```

**Success response — `200 OK`**

```json
[
  {
    "serviceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "serviceName": "Dental Checkup",
    "description": "Routine examination",
    "category": "Healthcare & Dental",
    "country": "United States",
    "city": "New York",
    "durationMinutes": 30,
    "price": 25.00
  }
]
```

---

### Create service

Creates a new service and links it to the authenticated provider's catalog.

```
POST /api/provider/services
Authorization: Bearer <accessToken>
```

**Request body** — same fields as [Update service](#update-service).

**Success response — `200 OK`** — Returns the created service.

---

### Update service

```
PATCH /api/provider/services/{serviceId}
Authorization: Bearer <accessToken>
```

**Request body**

```json
{
    "name": "Updated Service Name",
    "description": "New description",
    "category": "Beauty & Wellness",
    "country": "United States",
    "city": "New York",
    "durationMinutes": 45,
    "price": 30.00
}
```

---

### Get availability

```
GET /api/provider/availability
Authorization: Bearer <accessToken>
```

**Success response — `200 OK`**

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "17:00"
  }
]
```

---

### Update availability

Replaces all availability slots for the provider.

```
PUT /api/provider/availability
Authorization: Bearer <accessToken>
```

**Request body**

```json
{
  "slots": [
    {
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "17:00"
    }
  ]
}
```

---

## Admin endpoints

Require the `Admin` role.

### List users

```
GET /api/admin/users
Authorization: Bearer <accessToken>
```

**Success response — `200 OK`**

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "username": "jane",
    "email": "jane@example.com",
    "phoneNumber": "+1234567890",
    "role": "Customer",
    "isSuspended": false,
    "createdAt": "2026-01-15T10:00:00Z"
  }
]
```

---

### Update user

```
PATCH /api/admin/users/{id}
Authorization: Bearer <accessToken>
```

**Request body** — partial update of username, email, phone number, and/or role.

---

### Suspend user

```
PATCH /api/admin/users/{id}/suspend
Authorization: Bearer <accessToken>
```

Admins cannot suspend their own account.

---

### Unsuspend user

```
PATCH /api/admin/users/{id}/unsuspend
Authorization: Bearer <accessToken>
```

---

### Delete user

```
DELETE /api/admin/users/{id}
Authorization: Bearer <accessToken>
```

Admins cannot delete their own account.

---

## Using JWT in requests

Include the token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

The frontend axios client attaches this automatically when a token exists in `localStorage`.

Suspended accounts receive `403 Forbidden` on all authenticated requests.

## Example workflow with curl

```bash
# 1. Register as a customer
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"john\",\"email\":\"user@example.com\",\"password\":\"password123\",\"role\":\"Customer\"}"

# 2. Browse the catalog
curl http://localhost:8080/api/catalog

# 3. Create an appointment (use token from register/login)
curl -X POST http://localhost:8080/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"providerId\":\"PROVIDER_GUID\",\"serviceId\":\"SERVICE_GUID\",\"startTime\":\"2026-06-15T10:00:00Z\"}"

# 4. List your appointments
curl http://localhost:8080/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
