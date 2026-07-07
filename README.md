# AppointWeb

A portfolio appointment booking application with a **React** frontend and **ASP.NET Core** backend. Customers browse services and book appointments; providers manage their listings and availability; admins manage users.

## Documentation

| Guide | Description |
|-------|-------------|
| [Architecture](docs/architecture.md) | System overview and request flow |
| [API Reference](docs/api.md) | Endpoints, request/response formats |
| [Authentication](docs/authentication.md) | JWT flow, roles, frontend auth state |
| [Database](docs/database.md) | Schema, entities, migrations |
| [Frontend](docs/frontend.md) | React app structure and routing |

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
├── src/
│   ├── App/                      # Backend API + frontend
│   │   ├── ClientApp/            # React frontend (Vite)
│   │   ├── Controllers/          # API endpoints
│   │   ├── Data/                 # EF Core DbContext & configs
│   │   ├── Models/               # Domain models
│   │   ├── Services/             # Business logic & JWT
│   │   └── Migrations/           # Database migrations
│   └── docker/
│       └── docker-compose.yml    # PostgreSQL container
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

You can copy from `src/App/appsettings.Development.example.json`. The `Jwt:Key` must be long enough for HMAC-SHA256 signing (32+ characters recommended).

**Email (password reset)**

| Setting | Purpose |
|---------|---------|
| `Email:Host` | SMTP server (leave empty to log reset links instead of sending email) |
| `Email:Port` | SMTP port (587 for Gmail) |
| `Email:Username` / `Password` | SMTP credentials |
| `Email:FromAddress` / `FromName` | Sender shown in reset emails |
| `Frontend:BaseUrl` | Frontend URL used in reset links (e.g. `http://localhost:5173`) |

Without `Email:Host`, the API uses `LoggingEmailService` and prints reset links to the console — useful for local development.

Migrations run automatically when the API starts.

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

The frontend runs on **http://localhost:5173** and talks to the API at `http://localhost:8080`.

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

## Frontend pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Home page and service catalog |
| `/book/:providerId/:serviceId` | Public | Service detail and booking |
| `/login` | Public | Log in |
| `/register` | Public | Create an account (Customer or Provider) |
| `/forgot-password` | Public | Request a password reset email |
| `/reset-password?token=...` | Public | Set a new password from email link |
| `/account` | Authenticated | Account settings |
| `/appointments` | Authenticated | View and manage appointments |
| `/provider` | Provider, Admin | Provider dashboard |
| `/admin` | Admin | User management |

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
| `POST` | `/api/appointments` | Yes | Create an appointment |
| `PATCH` | `/api/appointments/{id}/cancel` | Yes | Cancel an appointment |
| `PATCH` | `/api/appointments/{id}/reschedule` | Yes | Reschedule an appointment |
| `GET` | `/api/account` | Yes | Get current user profile |
| `GET` | `/api/provider/services` | Provider | List the provider's services |
| `GET` | `/api/admin/users` | Admin | List all users |

## Troubleshooting

**Database connection failed on startup**

- Make sure Docker is running and PostgreSQL is up: `docker compose ps` in `src/docker`
- Confirm `appsettings.Development.json` exists and the connection string matches the Docker credentials

**Frontend cannot reach the API**

- Confirm the backend is running on port `8080`
- Check the browser console for CORS or network errors
- The API allows requests from `http://localhost:5173`

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
