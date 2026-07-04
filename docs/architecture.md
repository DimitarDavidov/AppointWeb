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
5. Frontend stores the token and user info (`username`, `email`, `role`) in Redux + `localStorage`
6. Navbar updates to show username dropdown menu
7. Subsequent API requests include `Authorization: Bearer <token>`
8. Backend validates the JWT on protected endpoints (e.g. creating appointments)

## Backend layers

```
Controllers     →  HTTP endpoints, request validation, status codes
Services        →  Business logic (JWT generation, user operations)
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
| `appsettings.Development.example.json` | Template to copy for local setup |
| `Properties/launchSettings.json` | Backend port (`8080`) |
| `src/docker/docker-compose.yml` | PostgreSQL credentials and port |

## Planned / not yet implemented

These are part of the intended design but not fully built yet:

- Admin panel content and API-side role enforcement (`[Authorize(Roles = "Admin")]`)
- Account and Appointments page functionality
- Frontend appointment booking UI
- Route guards on protected frontend pages
- Protected user endpoints (currently `GET /api/user` is public)
