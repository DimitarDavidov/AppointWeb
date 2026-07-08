# Architecture

AppointWeb is a full-stack appointment booking application split into three runtime components.

## System overview

```
┌─────────────────┐         HTTP (REST)         ┌─────────────────┐
│                 │  ─────────────────────────► │                 │
│  React Frontend │      localhost:5173 → 8080  │  ASP.NET API    │
│  (Vite)         │  ◄─────────────────────────  │  (.NET 9)       │
└─────────────────┘                             └────────┬────────┘
                                                         │
                                                         │ EF Core
                                                         ▼
                                                ┌─────────────────┐
                                                │   PostgreSQL    │
                                                │   (Docker)      │
                                                └─────────────────┘
```

## Components

### Frontend (`src/App/ClientApp`)

- **React 19** SPA built with **Vite**
- **React Router** for page navigation with role-based protected routes
- **Redux Toolkit** for global auth state
- **Axios** HTTP client with JWT interceptor
- **SCSS** for styling

The frontend runs as a separate dev server during development. It calls the backend API directly over HTTP.

### Backend (`src/App`)

- **ASP.NET Core 9** Web API
- **Entity Framework Core** with PostgreSQL provider
- **JWT Bearer** authentication with role-based authorization
- Controllers handle HTTP requests; services contain business logic

On startup the API:

1. Verifies the database connection
2. Applies EF Core migrations automatically
3. Listens on port `8080`

### Database (`src/docker`)

- **PostgreSQL 16** running in Docker
- Started via `docker compose` — only the database is containerized
- Backend and frontend run natively on the host machine

## User roles

| Role | Purpose |
|------|---------|
| `Customer` | Browse services and book appointments |
| `Provider` | Manage service listings, **per-service** availability, and incoming bookings |
| `Admin` | Manage users (edit, suspend, delete) via the admin panel |

Users register as **Customer** or **Provider**. The **Admin** role is assigned manually (for example via the database).

## Request flow (example: login)

1. User submits the login form on `/login`
2. Frontend sends `POST /api/auth/login` with email and password
3. Backend validates credentials against the `Users` table
4. Backend returns a signed JWT plus username, email, and role
5. Frontend stores the token in Redux + `localStorage`
6. Subsequent API requests include `Authorization: Bearer <token>`
7. Backend validates the JWT on protected endpoints

## Request flow (example: catalog browse and search)

1. User opens `/` (Home)
2. Frontend loads all offerings from `GET /api/catalog` (no auth required)
3. Logged-in providers do not see their own listings in the grid
4. The **catalog search bar** filters results **client-side** in the browser:
   - **Service search** — service name, provider username, category, description
   - **Location search** — city, country, or remote (keywords like `remote`, `online`, `virtual` match remote offerings)
5. User clicks a card → `/book/:providerId/:serviceId` for detail and booking

## Request flow (example: booking)

1. User browses the service catalog on `/`
2. User opens a service at `/book/:providerId/:serviceId`
3. If not logged in, they are redirected to `/login`
4. User picks a date/time and submits the booking form
5. Frontend sends `POST /api/appointments` with provider, service, and start time
6. Backend validates **service-specific** availability, prevents double-booking, and rejects self-booking
7. Appointment is created with status **Pending**; the provider receives a request email
8. Provider confirms via `PATCH /api/appointments/{id}/confirm` → status becomes **Booked**; the customer receives a confirmation email and in-app notification
9. Customer can view and manage the appointment at `/appointments`

## Request flow (example: reschedule)

1. Customer or provider proposes a new time via `PATCH /api/appointments/{id}/reschedule`
2. Backend stores the proposed time in `pendingRescheduleStartTime` / `pendingRescheduleEndTime` and sets status to **Pending**
3. The other party receives an email notification and an in-app notification
4. The other party accepts via `PATCH /api/appointments/{id}/reschedule/accept`
5. The party who requested the reschedule receives an acceptance email and in-app notification
6. If the appointment had a **confirmed** time before the request, reschedule counts and `previousStartTime` are updated; otherwise the change is treated as an initial time adjustment (not counted as a reschedule)
7. Status returns to **Booked** with the new time

## Request flow (example: provider panel)

1. A provider opens `/provider`
2. Frontend loads services from `GET /api/provider/services` and appointments from `GET /api/provider/appointments`
3. The dashboard shows a personalized greeting (based on the browser's local timezone), stat cards, and appointment tabs (Upcoming, Pending, Past, Cancelled)
4. From **My services**, the provider can add listings, edit service details, set **per-service booking hours**, and preview the public catalog page
5. Booking hours are loaded and saved via `GET/PUT /api/provider/services/{serviceId}/availability` — each service has its own schedule
6. Provider can confirm pending bookings, request/accept reschedules, cancel, and mark outcomes from the appointment tabs

## Request flow (example: password reset)

1. User opens `/forgot-password` and submits their email
2. Frontend sends `POST /api/auth/forgot-password`
3. Backend looks up user; if found, creates a hashed token and sends email
4. User clicks the link in the email → `/reset-password?token=...`
5. User enters a new password; frontend sends `POST /api/auth/reset-password`
6. Backend validates the token, updates the password, and marks the token as used

## Request flow (example: in-app notifications)

1. A logged-in user sees a **bell icon** in the navbar (next to the profile menu)
2. On load, the frontend polls `GET /api/notifications/unread-count` and `GET /api/notifications` every 30 seconds
3. When an appointment event occurs (confirm, cancel, reschedule request, reschedule accept), the backend creates a `Notifications` row for the recipient via `NotificationService`
4. The bell shows an unread badge; opening the panel lists recent notifications (newest first, up to 50)
5. Clicking a notification marks it read and navigates to `/appointments` (customers) or `/provider` (providers/admins)
6. **Mark all read** calls `PATCH /api/notifications/read-all`

## Request flow (example: ratings)

1. An appointment reaches a terminal state (**Completed**, **No-show**, or **Cancelled**)
2. Each participant sees a review section on the appointment (customers on `/appointments`, providers on the `/provider` past/cancelled tabs)
3. Leaving a review is optional; when opened, the star value and comment are both optional — the user may submit stars only, a comment only, or both (a fully empty submission is rejected)
4. The frontend upserts via `PUT /api/ratings/appointments/{id}`; the backend derives direction (customer→provider or provider→customer) and the rated user from the caller's role
5. Customer→provider ratings feed the **public** per-service average and reviews (Completed + No-show only), shown on the service page and catalog cards
6. Provider→customer ratings are aggregated into a customer's **overall rating** (stars only); it is revealed when a customer's name is clicked in the provider panel or on a public service review, via `GET /api/ratings/customers/{customerId}` (public)
7. The account page shows each user their own received ratings via `GET /api/ratings/me` — customers see their rating as a customer; providers also see their rating as a provider
8. Ratings are editable and removable at any time (`PUT` again or `DELETE`)

## Request flow (example: admin insights and CSV export)

1. An admin opens `/admin`
2. Frontend loads `GET /api/admin/users`, which now includes per-user stats computed server-side: `serviceCount`, `completedCount` (role-aware), `cancelledCount` (appointments the user cancelled), and `totalRevenue` (Completed appointments where the user is the provider)
3. These stats render inline on each user card and table row
4. Expanding a provider row calls `GET /api/admin/users/{id}/services` for a per-service breakdown (price, bookings, completed, cancelled, revenue), loaded lazily and cached per user
5. Clicking a cancelled count fetches the matching cancelled appointments — the user's (`/cancelled-appointments`) or a single service's (`/services/{serviceId}/cancelled-appointments`) — and the browser builds and downloads a CSV
6. Revenue is defined as the sum of `priceAtBooking` for **Completed** appointments only

## Appointment lifecycle

```
Customer books → Pending
                    │
         Provider confirms
                    ▼
                 Booked ──────► Completed / NoShow (after end time)
                    │
        Cancel (customer/provider/admin)
                    ▼
                Cancelled

Reschedule request (from Pending or Booked):
  → status Pending with proposed new time
  → other party accepts → Booked (with new time)
  → requester receives acceptance email and in-app notification
  → reschedule counts updated only if there was a confirmed time before
```

## Backend layers

```
Controllers     →  HTTP endpoints, request validation, status codes
Services        →  Business logic (JWT, password reset, email, notifications, account deletion)
Data            →  DbContext, entity configurations, migrations
Models          →  Domain entities (User, Service, Appointment, etc.)
DTOs            →  Request/response shapes for the API
Middleware      →  Global error handling, suspended-user blocking
```

## Middleware

| Middleware | Purpose |
|------------|---------|
| `ErrorHandlingMiddleware` | Catches unhandled exceptions and returns JSON error responses |
| `SuspendedUserMiddleware` | Blocks suspended accounts with `403 Forbidden` on authenticated requests |

## CORS

The API allows requests from the Vite dev server:

- `http://localhost:5173`
- `https://localhost:5173`

Configured in `Program.cs` under the `AllowFrontend` policy.

## Configuration

| File | Purpose |
|------|---------|
| `appsettings.Development.json` | Connection string, JWT, email settings (gitignored) |
| `appsettings.Development.example.json` | Template to copy for local setup |
| `Properties/launchSettings.json` | Backend port (`8080`) |
| `src/docker/docker-compose.yml` | PostgreSQL credentials and port |

## Business rules (high level)

- Providers **cannot book their own services** (enforced in API and UI)
- The home catalog hides a logged-in provider's own listings from the browse grid
- Catalog search and location filtering happen **client-side** on the full catalog response — there are no server-side search query parameters
- Services are either **in-person** (city + country required) or **remote** (`IsRemote = true`, city/country stored as empty strings)
- Appointment lists are scoped by role: customers see their bookings, providers see bookings where they are the provider, admins see all
- Double-booking is prevented by application checks and a PostgreSQL exclusion constraint
- Suspended users cannot use authenticated endpoints
- New bookings start as **Pending** until the provider confirms them
- **Availability is per service** — each listing can have its own weekly hours; if none are set, any time is allowed
- Reschedule requests require acceptance by the other party; only changes from a previously confirmed slot count toward reschedule history
- Ratings are optional and only allowed on terminal appointments (Completed, No-show, Cancelled) by the two participants; stars (0.5–5) and comment are each optional but at least one is required; per-service public averages count only Completed and No-show customer→provider ratings
- Email notifications are sent for booking requests, appointment confirmations, cancellations, reschedule proposals, and accepted reschedules (SMTP in production, console logging when `Email:Host` is empty)
- In-app notifications are stored in the database for appointment confirmations, cancellations, reschedule proposals, and accepted reschedules; the navbar bell polls for unread items
- Admin insights are derived on read (no new tables): per-user counts, per-service breakdowns, and revenue are computed by querying appointments; **revenue counts Completed appointments only** (sum of `priceAtBooking`)
