# Deployment (Railway)

AppointWeb is deployed on [Railway](https://railway.app) as three services: **PostgreSQL**, **API**, and **Frontend**.

## Live demo

| Service | URL |
|---------|-----|
| Frontend | https://appointweb-frontend-production.up.railway.app |
| API | https://appointweb-production.up.railway.app |

The frontend calls the API using the `VITE_API_URL` environment variable set at build time.

## Architecture on Railway

```
┌─────────────────────────┐     HTTPS      ┌─────────────────────────┐
│  Frontend (static)      │ ─────────────► │  ASP.NET API (Docker)   │
│  Root: ClientApp        │                │  Root: src/App          │
│  Vite build + serve     │                │  Listens on $PORT       │
└─────────────────────────┘                └────────────┬────────────┘
                                                        │
                                                        │ Npgsql (SSL)
                                                        ▼
                                               ┌─────────────────────────┐
                                               │  PostgreSQL (Railway)   │
                                               └─────────────────────────┘
```

On startup the API:

1. Resolves the database connection string (including Railway `postgres://` URIs)
2. Applies EF Core migrations
3. Seeds demo data if the marker user is missing (see [Database seeding](database.md#demo-seed-data))

## Railway services

Create three services in one Railway project:

| Service | Root directory | Build / deploy |
|---------|----------------|----------------|
| PostgreSQL | — | Railway PostgreSQL plugin |
| API (`AppointWeb`) | `src/App` | Dockerfile (`.NET 9` — Railpack does not support .NET 9) |
| Frontend | `src/App/ClientApp` | `railway.toml` → `npm install --include=dev && npm run build` |

Link the API service to the PostgreSQL service so Railway injects `DATABASE_URL`.

## API environment variables

Set these on the **API** service (use Railway variable references where noted):

| Variable | Example / notes |
|----------|-----------------|
| `ConnectionStrings__DefaultConnection` | `${{Postgres.DATABASE_URL}}` (reference the Postgres service) |
| `Jwt__Key` | Long random secret (32+ characters) |
| `Jwt__Issuer` | `AppointWeb` |
| `Jwt__Audience` | `AppointWeb` |
| `Frontend__BaseUrl` | Frontend public URL (no trailing slash), e.g. `https://appointweb-frontend-production.up.railway.app` |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `Email__ApiKey` | Resend API key (`re_...`) — **recommended on Railway** |
| `Email__FromAddress` | Verified sender in Resend (see [Email on Railway](#email-on-railway)) |
| `Email__FromName` | `AppointWeb` |

The API listens on Railway's `PORT` variable (see `Program.cs`).

### Connection string resolution

`ConnectionStringResolver` accepts:

- `ConnectionStrings:DefaultConnection` from configuration
- `DATABASE_URL` / `DATABASE_PRIVATE_URL` (Railway `postgres://` or `postgresql://` URIs)
- Individual `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` variables

Railway's `postgres://` format is converted automatically to an Npgsql connection string with SSL.

## Frontend environment variables

Set on the **Frontend** service:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | **API** public URL, e.g. `https://appointweb-production.up.railway.app` |

**Important:** `VITE_API_URL` must point to the **API**, not the frontend URL. It is baked in at build time — redeploy the frontend after changing it.

The frontend build is configured in `src/App/ClientApp/railway.toml`:

```toml
[build]
builder = "RAILPACK"
buildCommand = "npm install --include=dev && npm run build"
```

DevDependencies (Vite, TypeScript) are required for the production build.

## Email on Railway

Railway **Hobby** plans block outbound SMTP. Use **Resend** over HTTPS instead of Gmail SMTP.

Email provider selection in `Program.cs`:

| Condition | Provider |
|-----------|----------|
| `Email:ApiKey` set | `ResendEmailService` (HTTPS API) |
| `Email:Host` set | `SmtpEmailService` (MailKit) |
| Neither set | `LoggingEmailService` (console only) |

### Resend setup

1. Create a [Resend](https://resend.com) account and API key.
2. Set `Email__ApiKey` on the API service.
3. Set `Email__FromAddress` to an address Resend allows:
   - **Testing:** `onboarding@resend.dev` — only delivers to the Resend account owner's email.
   - **Production:** Verify your own domain in Resend and use e.g. `noreply@yourdomain.com`.

Until a domain is verified, password-reset and appointment emails will **not** reach arbitrary customer addresses, even though the API returns success for forgot-password (by design, to prevent email enumeration).

## CORS

The API allows:

- `http://localhost:5173` and `https://localhost:5173` (local dev)
- The origin from `Frontend:BaseUrl` (production frontend URL)

Set `Frontend__BaseUrl` to match your deployed frontend exactly.

## Docker (API)

The API image is built from `src/App/Dockerfile`:

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
# ... restore, publish ...

FROM mcr.microsoft.com/dotnet/aspnet:9.0
ENTRYPOINT ["dotnet", "AppointWeb.Api.dll"]
```

Railway must use **Root Directory** `src/App` so the Dockerfile is found.

## Local vs production

| Concern | Local | Railway |
|---------|-------|---------|
| Database | Docker PostgreSQL on `localhost:5432` | Railway PostgreSQL |
| API URL | `http://localhost:8080` | `https://appointweb-production.up.railway.app` |
| Frontend URL | `http://localhost:5173` | `https://appointweb-frontend-production.up.railway.app` |
| API base URL (frontend) | Default in `api.ts` | `VITE_API_URL` env var |
| Email | SMTP or console logging | Resend API key |
| Migrations | Auto on API startup | Auto on API startup |
| Demo seed | Auto on first deploy (if DB empty) | Auto on first deploy (if DB empty) |

## Troubleshooting (production)

**White screen / API errors in browser**

- Confirm `VITE_API_URL` is the **API** URL, not the frontend URL.
- Redeploy the frontend after fixing the variable.

**`ConnectionString not initialized` / DB connection failed**

- Set `ConnectionStrings__DefaultConnection` to `${{Postgres.DATABASE_URL}}`.
- Ensure the Postgres service is linked to the API service.

**`Format of initialization string`**

- Should be fixed by `ConnectionStringResolver`; verify the connection string variable references the Postgres plugin, not a mistyped URL.

**Emails not received**

- Resend test mode (`onboarding@resend.dev`) only sends to your Resend account email.
- Verify a custom domain for real recipients.
- Check API deploy logs for `Email provider: Resend` and send errors.

**Build fails (frontend)**

- Ensure `railway.toml` uses `npm install --include=dev` so Vite and TypeScript are available.

**Build fails (API)**

- Set Root Directory to `src/App` and use the Dockerfile (not Railpack for .NET).
