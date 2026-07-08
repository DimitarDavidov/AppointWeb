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
    "isRemote": false,
    "durationMinutes": 30,
    "price": 25.00,
    "averageRating": 4.5,
    "ratingCount": 12
  }
]
```

| Field | Type | Notes |
|-------|------|-------|
| `isRemote` | boolean | When `true`, the service is offered remotely; `city` and `country` are empty strings |
| `city`, `country` | string | Set for in-person services; empty when `isRemote` is `true` |
| `averageRating` | number \| null | Average customer star rating for this provider's service; `null` when there are no rated appointments |
| `ratingCount` | integer | Number of star ratings backing the average (public statuses only) |

Public ratings count only **Completed** and **No-show** appointments. Comment-only reviews (no stars) are excluded from `averageRating` and `ratingCount`.

The home page filters this list **client-side** — there are no server-side catalog search query parameters.

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

### Get service reviews

Returns the public rating summary and written reviews for a provider's service. No authentication required.

```
GET /api/catalog/{providerId}/{serviceId}/reviews
```

**Success response — `200 OK`**

```json
{
  "averageRating": 4.5,
  "ratingCount": 12,
  "reviews": [
    {
      "stars": 5.0,
      "comment": "Great experience, highly recommend.",
      "reviewerUsername": "john",
      "createdAt": "2026-06-20T14:30:00Z"
    }
  ]
}
```

| Field | Type | Notes |
|-------|------|-------|
| `averageRating` | number \| null | Average of star values from public ratings; `null` when none |
| `ratingCount` | integer | Number of star ratings backing the average |
| `reviews` | array | Public reviews that include a **comment**, newest first (a review may have a comment with `stars: null`) |

Only ratings on **Completed** or **No-show** appointments are included. Provider→customer ratings are never returned here.

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
    "previousStartTime": null,
    "hasRated": false,
    "myRatingStars": null,
    "myRatingComment": null
  }
]
```

| Field | Type | Notes |
|-------|------|-------|
| `hasRated` | boolean | Whether the **current user** has left a rating for this appointment |
| `myRatingStars` | number \| null | The current user's own star value, if any |
| `myRatingComment` | string \| null | The current user's own comment, if any |

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
- Booking must fall within the **service's** availability windows (if configured for that service)
- Overlapping `Booked` or `Pending` appointments for the same provider are blocked by application logic and a PostgreSQL exclusion constraint

---

### Confirm appointment

Provider or admin confirms a pending booking.

```
PATCH /api/appointments/{id}/confirm
Authorization: Bearer <accessToken>
```

**Success response — `200 OK`** — Returns the updated appointment with status `Booked`.

**Business rules**

- Only appointments in **`Pending`** status can be confirmed
- The **customer** receives a confirmation email and in-app notification with the service name, provider name, and appointment time

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

The API records `cancelledByUserId` from the authenticated user. The other party is notified by email and in-app notification.

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
- Sends an email and in-app notification to the other party
- If the appointment had never been confirmed, accepting the request updates the time but does **not** increment reschedule counts

**Error responses**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Appointment not found |
| `403 Forbidden` | User does not have access |
| `400 Bad Request` | Invalid time, inactive service, outside **service** availability, or missing reason (provider) |
| `409 Conflict` | New time slot already booked |

---

### Accept reschedule

Accepts a pending reschedule request from the other party.

```
PATCH /api/appointments/{id}/reschedule/accept
Authorization: Bearer <accessToken>
```

**Success response — `200 OK`** — Returns the updated appointment with status `Booked` and the new time applied.

**Business rules**

- Clears pending reschedule fields and sets status to **`Booked`**
- If the appointment had a confirmed time before the request, updates `previousStartTime` and the appropriate reschedule count
- The **requester** (the user who proposed the reschedule) receives an acceptance email and in-app notification with the previous and new times

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

## Notification endpoints

All require authentication. Notifications are scoped to the authenticated user.

### List notifications

Returns the user's most recent notifications (up to 50), newest first.

```
GET /api/notifications
Authorization: Bearer <accessToken>
```

**Success response — `200 OK`**

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "type": "AppointmentConfirmed",
    "title": "Appointment confirmed",
    "message": "Provider confirmed your Haircut appointment for Monday, June 16, 2026 at 2:00 PM UTC.",
    "appointmentId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "isRead": false,
    "createdAt": "2026-06-15T10:30:00Z"
  }
]
```

**Notification types**

| Type | Recipient | When created |
|------|-----------|--------------|
| `AppointmentConfirmed` | Customer | Provider confirms a pending booking |
| `AppointmentCancelled` | Other party | Customer or provider cancels |
| `RescheduleReceived` | Other party | A reschedule is proposed |
| `RescheduleAccepted` | Requester | The other party accepts a reschedule |

### Get unread count

```
GET /api/notifications/unread-count
Authorization: Bearer <accessToken>
```

**Success response — `200 OK`**

```json
{
  "count": 2
}
```

### Mark one notification as read

```
PATCH /api/notifications/{id}/read
Authorization: Bearer <accessToken>
```

**Success response — `204 No Content`**

**Error responses**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Notification not found or belongs to another user |

### Mark all notifications as read

```
PATCH /api/notifications/read-all
Authorization: Bearer <accessToken>
```

**Success response — `204 No Content`**

---

## Rating endpoints

All require authentication. A rating can only be left by the appointment's **customer** or **provider**, and only once the appointment is **Completed**, **No-show**, or **Cancelled**. Each participant has one rating per appointment (customer→provider or provider→customer) and may edit it at any time.

Both the star value and the comment are optional and independent — a submission may contain stars only, a comment only, or both. A completely empty submission is rejected.

### Get my rating

Returns the current user's own rating for an appointment.

```
GET /api/ratings/appointments/{appointmentId}
Authorization: Bearer <accessToken>
```

**Success response — `200 OK`**

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "appointmentId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "direction": "CustomerToProvider",
  "stars": 4.5,
  "comment": "Friendly and on time.",
  "createdAt": "2026-06-20T14:30:00Z",
  "updatedAt": "2026-06-20T14:30:00Z"
}
```

`204 No Content` is returned when the user has not rated this appointment.

### Create or update my rating

Upserts the current user's rating. Direction and the rated user are derived from the caller's role in the appointment.

```
PUT /api/ratings/appointments/{appointmentId}
Authorization: Bearer <accessToken>
```

**Request body**

```json
{
  "stars": 4.5,
  "comment": "Friendly and on time."
}
```

| Field | Type | Rules |
|-------|------|-------|
| `stars` | number \| null | Optional. When present, must be 0.5–5.0 in 0.5 increments |
| `comment` | string \| null | Optional, max 1000 characters |

**Success response — `200 OK`** — Returns the created/updated rating.

**Error responses**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | Both stars and comment empty, or stars out of range / not a half-step |
| `403 Forbidden` | Caller is not a participant in the appointment |
| `404 Not Found` | Appointment not found |

### Delete my rating

```
DELETE /api/ratings/appointments/{appointmentId}
Authorization: Bearer <accessToken>
```

**Success response — `204 No Content`**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | The user has no rating for this appointment |

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
    "isRemote": false,
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
    "isRemote": false,
    "country": "United States",
    "city": "New York",
    "durationMinutes": 45,
    "price": 30.00
}
```

| Field | Type | Rules |
|-------|------|-------|
| `isRemote` | boolean | When `true`, city and country are cleared and not required |
| `country` | string | Required for in-person services (`isRemote: false`) |
| `city` | string | Required for in-person services (`isRemote: false`) |

Create and update use `ServiceLocationNormalizer` on the backend: remote services store empty `city`/`country`; in-person services require both.

---

### Get service availability

Returns weekly booking windows for a specific service owned by the authenticated provider.

```
GET /api/provider/services/{serviceId}/availability
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

| Field | Type | Notes |
|-------|------|-------|
| `dayOfWeek` | integer | 0 = Sunday through 6 = Saturday |
| `startTime` | string | Local time (`HH:mm`) |
| `endTime` | string | Local time (`HH:mm`), must be after `startTime` |

**Error responses**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Service not found or not owned by the provider |

---

### Update service availability

Replaces all availability slots for the given service. Other services keep their own schedules.

```
PUT /api/provider/services/{serviceId}/availability
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

**Success response — `200 OK`** — Returns the updated slot list (same shape as GET).

**Business rules**

- Availability is **per service**, not shared across a provider's catalog
- If a service has **no** availability rows, customers can book any time (subject to double-booking checks)
- Deleting a service cascades and removes its availability rows

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
