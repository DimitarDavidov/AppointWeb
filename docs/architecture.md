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
| `Provider` | Manage service listings, availability, and incoming bookings |
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

## Request flow (example: booking)

1. User browses the service catalog on `/`
2. User opens a service at `/book/:providerId/:serviceId`
3. If not logged in, they are redirected to `/login`
4. User picks a date/time and submits the booking form
5. Frontend sends `POST /api/appointments` with provider, service, and start time
6. Backend validates availability, prevents double-booking, and rejects self-booking
7. User sees a confirmation and can view the appointment at `/appointments`

## Request flow (example: provider panel)

1. A provider opens `/provider`
2. Frontend loads the provider's services from `GET /api/provider/services`
3. Frontend loads appointments from `GET /api/appointments` (filtered server-side by provider ID)
4. Provider can edit services, manage availability, and handle upcoming bookings

## Request flow (example: password reset)

1. User opens `/forgot-password` and submits their email
2. Frontend sends `POST /api/auth/forgot-password`
3. Backend looks up user; if found, creates a hashed token and sends email
4. User clicks the link in the email → `/reset-password?token=...`
5. User enters a new password; frontend sends `POST /api/auth/reset-password`
6. Backend validates the token, updates the password, and marks the token as used

## Backend layers

```
Controllers     →  HTTP endpoints, request validation, status codes
Services        →  Business logic (JWT, password reset, email, account deletion)
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
- Appointment lists are scoped by role: customers see their bookings, providers see bookings where they are the provider, admins see all
- Double-booking is prevented by application checks and a PostgreSQL exclusion constraint
- Suspended users cannot use authenticated endpoints
