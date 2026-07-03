# AppointWeb

A portfolio appointment booking application with a **React** frontend and **ASP.NET Core** backend. Users can register, log in, and book appointments. PostgreSQL runs locally via Docker.

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
| Auth | JWT (register / login) |

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
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

You can copy the template above and adjust values if needed to. The `Jwt:Key` must be long enough for HMAC-SHA256 signing (32+ characters recommended).

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

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/login` | Log in |
| `/register` | Create an account |

After login or registration, a JWT is stored in Redux and `localStorage`. See [Authentication](docs/authentication.md) for details.

## API endpoints

See the full [API Reference](docs/api.md) for request/response formats and examples.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Log in and receive a JWT |
| `GET` | `/api/user` | No | List users |
| `POST` | `/api/appointments` | Yes | Create an appointment |

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
