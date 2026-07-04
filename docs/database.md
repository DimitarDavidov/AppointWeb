# Database

AppointWeb uses **PostgreSQL 16** with **Entity Framework Core** for data access. Migrations are applied automatically when the API starts.

## Entity relationship diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    Users     │       │   Appointments   │       │   Services   │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ Id (PK)      │◄──┐   │ Id (PK)          │   ┌──►│ Id (PK)      │
│ Email        │   ├───│ CustomerId (FK)  │   │   │ Name         │
│ PasswordHash │   │   │ ProviderId (FK)  │───┘   │ Description  │
│ Role         │   └───│ ServiceId (FK)   │───────│ DurationMin  │
│ CreatedAt    │◄──────│ StartTime        │       │ Price        │
└──────────────┘       │ EndTime          │       │ IsActive     │
       ▲               │ Status           │       │ CreatedAt    │
       │               │ PriceAtBooking   │       └──────────────┘
       │               │ CreatedAt        │
       └───────────────│                  │
         (Provider)    └──────────────────┘
```

A user can be a **customer** (books appointments) or a **provider** (delivers services). The same `Users` table serves both roles.

## Tables

### Users

| Column | Type | Notes |
|--------|------|-------|
| `Id` | uuid | Primary key |
| `Email` | text | Required, unique index |
| `PasswordHash` | text | Required, ASP.NET Identity hasher |
| `Role` | text | Required, default `"Customer"` |
| `CreatedAt` | timestamptz | UTC |

### Services

| Column | Type | Notes |
|--------|------|-------|
| `Id` | uuid | Primary key |
| `Name` | varchar(200) | Required |
| `Description` | varchar(1000) | Optional |
| `DurationMinutes` | integer | 1–1440 |
| `Price` | numeric | 0–100000 |
| `IsActive` | boolean | Default `true` |
| `CreatedAt` | timestamptz | UTC |

### Appointments

| Column | Type | Notes |
|--------|------|-------|
| `Id` | uuid | Primary key |
| `CustomerId` | uuid | FK → Users |
| `ProviderId` | uuid | FK → Users |
| `ServiceId` | uuid | FK → Services |
| `StartTime` | timestamptz | UTC |
| `EndTime` | timestamptz | Calculated from service duration |
| `Status` | integer | Enum: `Booked`, etc. |
| `PriceAtBooking` | numeric | Snapshot of service price at booking time |
| `CreatedAt` | timestamptz | UTC |

## Constraints

### Unique email

Each user must have a unique email address (index `IX_Users_Email`).

### Double-booking prevention

A PostgreSQL **exclusion constraint** prevents overlapping appointments for the same provider:

```
EX_Appointments_NoOverlap_PerProvider
```

Two `Booked` appointments for the same provider cannot overlap in time. The application also checks for overlaps before inserting, and catches the constraint violation as a fallback.

### Password reset tokens

| Column | Type | Notes |
|--------|------|-------|
| `Id` | uuid | Primary key |
| `UserId` | uuid | FK → Users (cascade delete) |
| `TokenHash` | varchar(64) | SHA-256 hex of raw token, unique index |
| `ExpiresAt` | timestamptz | UTC, default 1 hour from creation |
| `CreatedAt` | timestamptz | UTC |
| `UsedAt` | timestamptz | Null until token is consumed |

Raw reset tokens are never stored — only the hash. The plain token is sent by email and submitted once by the client.

## Migrations

Migrations live in `src/App/Migrations/` and are applied on API startup via `ApplyMigrations()` in `Program.cs`.

| Migration | Description |
|-----------|-------------|
| `AddServicesAndAppointments` | Creates Users, Services, Appointments tables |
| `AddUserAuthFields` | Adds PasswordHash, Role, CreatedAt to Users; unique email index |
| `AddAppointmentDoubleBookingConstraint` | PostgreSQL exclusion constraint for provider overlap |
| `AddPasswordResetTokens` | Creates PasswordResetTokens table for email password reset |

### Manual migration commands

Normally migrations run automatically. To run them manually:

```bash
cd src/App
dotnet ef database update
```

To create a new migration after model changes:

```bash
cd src/App
dotnet ef migrations add YourMigrationName
```

## Docker connection details

These match `src/docker/docker-compose.yml`:

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `appointwebdb` |
| Username | `appointweb` |
| Password | `appointweb_password` |

Connection string:

```
Host=localhost;Port=5432;Database=appointwebdb;Username=appointweb;Password=appointweb_password
```

## Connecting directly

To inspect the database with `psql`:

```bash
docker exec -it appointweb_postgres psql -U appointweb -d appointwebdb
```

Useful queries:

```sql
-- List users
SELECT "Id", "Email", "Role", "CreatedAt" FROM "Users";

-- List services
SELECT * FROM "Services";

-- List appointments
SELECT * FROM "Appointments";
```
