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
- **React Router** for page navigation
- **Redux Toolkit** for global auth state
- **Axios** HTTP client with JWT interceptor
- **SCSS** for styling

The frontend runs as a separate dev server during development. It calls the backend API directly over HTTP.

### Backend (`src/App`)

- **ASP.NET Core 9** Web API
- **Entity Framework Core** with PostgreSQL provider
- **JWT Bearer** authentication
- Controllers handle HTTP requests; services contain business logic

On startup the API:

1. Verifies the database connection
2. Applies EF Core migrations automatically
3. Listens on port `8080`

### Database (`src/docker`)

- **PostgreSQL 16** running in Docker
- Started via `docker compose` — only the database is containerized
- Backend and frontend run natively on the host machine

## Request flow (example: login)

1. User submits the login form on `/login`
2. Frontend sends `POST /api/auth/login` with email and password
3. Backend validates credentials against the `Users` table
4. Backend returns a signed JWT
5. Frontend stores the token in Redux + `localStorage`
6. Subsequent API requests include `Authorization: Bearer <token>`
7. Backend validates the JWT on protected endpoints (e.g. creating appointments)

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
Services        →  Business logic (JWT, password reset, email)
Repositories    →  Data access abstraction
Data            →  DbContext, entity configurations, migrations
Models          →  Domain entities (User, Service, Appointment)
DTOs            →  Request/response shapes for the API
Middleware      →  Global error handling
```

## CORS

The API allows requests from the Vite dev server:

- `http://localhost:5173`
- `https://localhost:5173`

Configured in `Program.cs` under the `AllowFrontend` policy.

## Configuration

| File | Purpose |
|------|---------|
| `appsettings.Development.json` | Connection string, JWT settings (gitignored) |
| `appsettings.Development.example.json` | Template to copy for local setup (JWT, Email, Frontend URL) |
| `Properties/launchSettings.json` | Backend port (`8080`) |
| `src/docker/docker-compose.yml` | PostgreSQL credentials and port |

## Planned / not yet implemented

These are part of the intended design but not fully built yet:

- Admin panel with role-based access (`Role = "Admin"`)
- Logout button wired to Redux
- Conditional navbar (show Login/Register vs Logout based on auth state)
- Protected user endpoints (currently `GET /api/user` is public)
- Frontend appointment booking UI
