# AppointWeb

A portfolio appointment booking application with a **React** frontend and **ASP.NET Core** backend. Customers browse services and book appointments; providers manage their listings and availability; admins manage users.

## Live demo

| Service | URL |
|---------|-----|
| **App** | https://appointweb-frontend-production.up.railway.app |
| **API** | https://appointweb-production.up.railway.app |

Deployed on [Railway](https://railway.app). See [Deployment guide](docs/deployment.md) for environment variables and setup.

## Documentation

| Guide | Description |
|-------|-------------|
| [Architecture](docs/architecture.md) | System overview and request flow |
| [API Reference](docs/api.md) | Endpoints, request/response formats |
| [Authentication](docs/authentication.md) | JWT flow, roles, frontend auth state |
| [Database](docs/database.md) | Schema, entities, migrations, demo seed |
| [Frontend](docs/frontend.md) | React app structure and routing |
| [Deployment](docs/deployment.md) | Railway production setup |

Full documentation index: **[docs/README.md](docs/README.md)**

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Redux Toolkit, React Router, SCSS |
| Backend | ASP.NET Core 9, Entity Framework Core |
| Database | PostgreSQL 16 (Docker) |
| Auth | JWT (register / login) + password reset via email |

## Prerequisites

Install these before running the app locally:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)
- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 18 or later (for the frontend)

## Project structure

```
AppointWeb/
├── docs/                         # Detailed documentation
├── src/
│   ├── App/                      # Backend API + frontend
│   │   ├── ClientApp/            # React frontend (Vite)
│   │   ├── Controllers/          # API endpoints
│   │   ├── Data/                 # EF Core DbContext, seeding
│   │   ├── Extensions/           # Connection string resolver, etc.
│   │   ├── Dockerfile            # API container image (Railway)
│   │   ├── Models/               # Domain models
│   │   ├── Services/             # Business logic, JWT, email
│   │   └── Migrations/           # Database migrations
│   └── docker/
│       └── docker-compose.yml    # PostgreSQL container (local)
└── README.md
```

## Local setup

The app runs as three parts: **PostgreSQL (Docker)**, **backend API**, and **frontend dev server**.

### 1. Start the database (Docker)

From the repo root:

```bash
cd src/docker
docker compose up -d
```

This starts PostgreSQL with:

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `appointwebdb` |
| Username | `appointweb` |
| Password | `appointweb_password` |

Check that the container is running:

```bash
docker compose ps
```

Stop the database when you are done:

```bash
docker compose down
```

To remove stored data as well:

```bash
docker compose down -v
```

### 2. Configure the backend

The backend reads settings from `appsettings.json` and `appsettings.Development.json` (these files are gitignored).

Create `src/App/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=appointwebdb;Username=appointweb;Password=appointweb_password"
  },
  "Jwt": {
    "Key": "your-super-secret-jwt-key-at-least-32-characters-long",
    "Issuer": "AppointWeb",
    "Audience": "AppointWeb",
    "ExpiresMinutes": "60"
  },
  "Email": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "Username": "your-gmail@gmail.com",
    "Password": "your-gmail-app-password",
    "FromAddress": "your-gmail@gmail.com",
    "FromName": "AppointWeb",
    "UseSsl": true
  },
  "Frontend": {
    "BaseUrl": "http://localhost:5173"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

The `Jwt:Key` must be long enough for HMAC-SHA256 signing (32+ characters recommended).

**Email (password reset and appointment notifications)**

The API picks an email provider automatically:

| Configuration | Provider | Typical use |
|---------------|----------|-------------|
| `Email:ApiKey` set | Resend (HTTPS) | Railway / production (SMTP blocked on Hobby) |
| `Email:Host` set | SMTP (MailKit) | Local dev with Gmail |
| Neither set | Console logging | Local dev without SMTP |

| Setting | Purpose |
|---------|---------|
| `Email:ApiKey` | Resend API key (`re_...`) |
| `Email:Host` | SMTP server |
| `Email:Port` | SMTP port (587 for Gmail) |
| `Email:Username` / `Password` | SMTP credentials |
| `Email:FromAddress` / `FromName` | Sender shown in emails |
| `Frontend:BaseUrl` | Frontend URL used in email links (e.g. `http://localhost:5173`) |

See [Authentication → Email delivery](docs/authentication.md#email-delivery) for triggers and [Deployment](docs/deployment.md) for Railway + Resend setup.

On startup the API applies EF Core migrations and seeds demo data when the database is empty. See [Database → Demo seed data](docs/database.md#demo-seed-data).

### 3. Start the backend API

```bash
cd src/App
dotnet run
```

The API listens on **http://localhost:8080**.

On startup it will:

1. Check the database connection
2. Apply pending EF Core migrations
3. Start accepting requests

### 4. Start the frontend

In a separate terminal:

```bash
cd src/App/ClientApp
npm install
npm run dev
```

The frontend runs on **http://localhost:5173** and talks to the API at `http://localhost:8080` (default in `src/api/api.ts`).

For other environments, set `VITE_API_URL` before building the frontend (see [Frontend → Environment](docs/frontend.md#environment)).

## URLs

### Local

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

### Production (Railway)

| Service | URL |
|---------|-----|
| Frontend | https://appointweb-frontend-production.up.railway.app |
| Backend API | https://appointweb-production.up.railway.app |

## Frontend pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Home page, service catalog, and client-side search |
| `/book/:providerId/:serviceId` | Public | Service detail and booking |
| `/login` | Public | Log in |
| `/register` | Public | Create an account (Customer or Provider) |
| `/forgot-password` | Public | Request a password reset email |
| `/reset-password?token=...` | Public | Set a new password from email link |
| `/account` | Authenticated | Account settings |
| `/appointments` | Authenticated | View and manage appointments |
| `/provider` | Provider, Admin | Provider dashboard |
| `/admin` | Admin | User management with per-user stats, service breakdown, and cancelled-appointment CSV export |

After login or registration, a JWT is stored in Redux and `localStorage`. See [Authentication](docs/authentication.md) for details.

## API endpoints

See the full [API Reference](docs/api.md) for request/response formats and examples.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Log in and receive a JWT |
| `POST` | `/api/auth/forgot-password` | No | Request password reset email |
| `POST` | `/api/auth/reset-password` | No | Reset password with email token |
| `GET` | `/api/catalog` | No | List bookable provider services |
| `GET` | `/api/appointments` | Yes | List appointments (scoped by role) |
| `POST` | `/api/appointments` | Yes | Create an appointment (starts as Pending) |
| `PATCH` | `/api/appointments/{id}/cancel` | Yes | Cancel an appointment |
| `PATCH` | `/api/appointments/{id}/confirm` | Provider, Admin | Confirm a pending booking |
| `PATCH` | `/api/appointments/{id}/reschedule` | Yes | Request a new time |
| `PATCH` | `/api/appointments/{id}/reschedule/accept` | Yes | Accept a pending reschedule |
| `PATCH` | `/api/appointments/{id}/status` | Yes | Mark Completed or NoShow |
| `GET` | `/api/notifications` | Yes | List in-app notifications |
| `GET` | `/api/notifications/unread-count` | Yes | Unread notification count for navbar badge |
| `PATCH` | `/api/notifications/{id}/read` | Yes | Mark one notification as read |
| `PATCH` | `/api/notifications/read-all` | Yes | Mark all notifications as read |
| `GET` | `/api/catalog/{providerId}/{serviceId}/reviews` | No | Public rating summary and reviews for a service |
| `GET` | `/api/ratings/customers/{customerId}` | No | A customer's overall rating (stars only) |
| `GET` | `/api/ratings/me` | Yes | Current user's own received ratings (as customer / provider) |
| `GET` | `/api/ratings/appointments/{id}` | Yes | Get the current user's rating for an appointment |
| `PUT` | `/api/ratings/appointments/{id}` | Yes | Create or update the current user's rating |
| `DELETE` | `/api/ratings/appointments/{id}` | Yes | Remove the current user's rating |
| `GET` | `/api/provider/appointments` | Provider, Admin | List provider-scoped appointments |
| `GET` | `/api/account` | Yes | Get current user profile |
| `GET` | `/api/provider/services` | Provider | List the provider's services |
| `GET` | `/api/provider/services/{serviceId}/availability` | Provider | Get booking hours for a service |
| `PUT` | `/api/provider/services/{serviceId}/availability` | Provider | Set booking hours for a service |
| `GET` | `/api/admin/users` | Admin | List all users with per-user stats (services, completed, cancelled, revenue) |
| `GET` | `/api/admin/users/{id}/services` | Admin | Per-service breakdown (revenue, completed, cancelled) for a provider |
| `GET` | `/api/admin/users/{id}/cancelled-appointments` | Admin | Appointments the user cancelled (CSV export) |
| `GET` | `/api/admin/users/{id}/services/{serviceId}/cancelled-appointments` | Admin | A service's cancelled appointments (CSV export) |

## Troubleshooting

**Database connection failed on startup**

- Make sure Docker is running and PostgreSQL is up: `docker compose ps` in `src/docker`
- Confirm `appsettings.Development.json` exists and the connection string matches the Docker credentials

**Frontend cannot reach the API**

- Confirm the backend is running on port `8080`
- Check the browser console for CORS or network errors
- The API allows requests from `http://localhost:5173`
- **Production:** ensure `VITE_API_URL` points to the API URL and `Frontend:BaseUrl` matches the frontend origin

**White screen after deploy**

- Usually `VITE_API_URL` was set to the frontend URL instead of the API URL — fix and redeploy the frontend service

**Port already in use**

- PostgreSQL: change `"5432:5432"` in `docker-compose.yml` if 5432 is taken
- Backend: change `applicationUrl` in `src/App/Properties/launchSettings.json`
- Frontend: Vite will offer the next free port if 5173 is busy

## Development commands

**Backend**

```bash
cd src/App
dotnet run          # Run API
```

**Frontend**

```bash
cd src/App/ClientApp
npm run dev         # Dev server with hot reload
npm run build       # Production build
```

**Database**

```bash
cd src/docker
docker compose up -d     # Start PostgreSQL
docker compose down      # Stop PostgreSQL
docker compose logs -f   # View PostgreSQL logs
```
