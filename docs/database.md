# Database

AppointWeb uses **PostgreSQL 16** with **Entity Framework Core** for data access. Migrations are applied automatically when the API starts.

## Entity relationship diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    Users     │       │   Appointments   │       │   Services   │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ Id (PK)      │◄──┐   │ Id (PK)          │   ┌──►│ Id (PK)      │
│ Email        │   ├───│ CustomerId (FK)  │   │   │ Name         │
│ Username     │   │   │ ProviderId (FK)  │───┘   │ Description  │
│ PasswordHash │   └───│ ServiceId (FK)   │───────│ Category     │
│ Role         │◄──────│ StartTime        │       │ DurationMin  │
│ PhoneNumber  │       │ EndTime          │       │ Price        │
│ IsSuspended  │       │ Status           │       │ IsActive     │
│ CreatedAt    │       │ PriceAtBooking   │       │ CreatedAt    │
└──────┬───────┘       │ CreatedAt        │       └──────┬───────┘
       │               └──────────────────┘              │
       │                                                 │
       │         ┌──────────────────┐                    │
       ├────────►│ ProviderServices │◄───────────────────┘
       │         ├──────────────────┤
       │         │ Id (PK)          │
       │         │ ProviderId (FK)  │
       │         │ ServiceId (FK)   │
       │         │ IsActive         │
       │         │ CreatedAt        │
       │         └──────────────────┘
       │
       │         ┌──────────────────────┐
       └────────►│ ProviderAvailabilities│◄── Services
                 ├──────────────────────┤
                 │ Id (PK)              │
                 │ ProviderId (FK)      │
                 │ ServiceId (FK)       │
                 │ DayOfWeek            │
                 │ StartTime            │
                 │ EndTime              │
                 └──────────────────────┘

                 ┌──────────────────┐
                 │  Notifications   │
                 ├──────────────────┤
                 │ Id (PK)          │
                 │ UserId (FK)      │──► Users
                 │ Type             │
                 │ Title            │
                 │ Message          │
                 │ AppointmentId(FK)│──► Appointments (optional)
                 │ IsRead           │
                 │ CreatedAt        │
                 └──────────────────┘

                 ┌──────────────────┐
                 │     Ratings      │
                 ├──────────────────┤
                 │ Id (PK)          │
                 │ AppointmentId(FK)│──► Appointments (cascade)
                 │ ServiceId (FK)   │──► Services
                 │ RaterId (FK)     │──► Users
                 │ RateeId (FK)     │──► Users
                 │ Direction        │
                 │ Stars (nullable) │
                 │ Comment          │
                 │ CreatedAt        │
                 │ UpdatedAt        │
                 └──────────────────┘
```

A user can be a **customer** (books appointments), a **provider** (delivers services), or an **admin** (manages users). The same `Users` table serves all roles.

Services are linked to providers through the `ProviderServices` join table. The public catalog shows active provider–service pairings.

## Tables

### Users

| Column | Type | Notes |
|--------|------|-------|
| `Id` | uuid | Primary key |
| `Email` | text | Required, unique index |
| `Username` | varchar(50) | Required, unique index |
| `PasswordHash` | text | Required, ASP.NET Identity hasher |
| `Role` | text | Required, default `"Customer"` |
| `PhoneNumber` | text | Optional |
| `IsSuspended` | boolean | Default `false` |
| `CreatedAt` | timestamptz | UTC |

### Services

| Column | Type | Notes |
|--------|------|-------|
| `Id` | uuid | Primary key |
| `Name` | varchar(200) | Required |
| `Description` | varchar(1000) | Optional |
| `Category` | varchar(100) | Required for new/updated services. One of the predefined catalog categories |
| `Country` | varchar(100) | Required column; empty string when `IsRemote` is `true` |
| `City` | varchar(100) | Required column; empty string when `IsRemote` is `true` |
| `IsRemote` | boolean | Default `false`. When `true`, the service is offered remotely and city/country are stored as empty strings |
| `DurationMinutes` | integer | 1–1440 |
| `Price` | numeric | 0–100000 |
| `IsActive` | boolean | Default `true` |
| `CreatedAt` | timestamptz | UTC |

### ProviderServices

Links providers to the services they offer.

| Column | Type | Notes |
|--------|------|-------|
| `Id` | uuid | Primary key |
| `ProviderId` | uuid | FK → Users |
| `ServiceId` | uuid | FK → Services |
| `IsActive` | boolean | Default `true` |
| `CreatedAt` | timestamptz | UTC |

Unique index on `(ProviderId, ServiceId)`.

### ProviderAvailabilities

Weekly booking windows for a **specific service** offered by a provider. Each service can have its own schedule.

| Column | Type | Notes |
|--------|------|-------|
| `Id` | uuid | Primary key |
| `ProviderId` | uuid | FK → Users (cascade delete) |
| `ServiceId` | uuid | FK → Services (cascade delete) |
| `DayOfWeek` | integer | 0 = Sunday through 6 = Saturday |
| `StartTime` | time | Local start time |
| `EndTime` | time | Local end time |

Indexes on `(ProviderId, ServiceId)` and `(ServiceId, DayOfWeek)`.

If a service has no availability rows, booking is allowed at any time (still subject to overlap checks).

### Appointments

| Column | Type | Notes |
|--------|------|-------|
| `Id` | uuid | Primary key |
| `CustomerId` | uuid | FK → Users |
| `ProviderId` | uuid | FK → Users |
| `ServiceId` | uuid | FK → Services |
| `StartTime` | timestamptz | UTC |
| `EndTime` | timestamptz | Calculated from service duration |
| `Status` | integer | Enum: `Booked` (0), `Cancelled` (1), `Completed` (2), `NoShow` (3), `Pending` (4) |
| `PriceAtBooking` | numeric | Snapshot of service price at booking time |
| `CancellationReason` | varchar(1000) | Optional, set on cancel |
| `CancelledByUserId` | uuid | Optional, user who cancelled |
| `PendingRescheduleStartTime` | timestamptz | Proposed start time during reschedule |
| `PendingRescheduleEndTime` | timestamptz | Proposed end time during reschedule |
| `PendingRescheduleFromConfirmedSlot` | boolean | Whether the open reschedule started from a confirmed slot |
| `RescheduleReason` | varchar(1000) | Reason for the current reschedule request |
| `RescheduleRequestedByUserId` | uuid | User who requested the reschedule |
| `ProviderRescheduleCount` | integer | Times the provider rescheduled after confirmation |
| `CustomerRescheduleCount` | integer | Times the customer rescheduled after confirmation |
| `PreviousStartTime` | timestamptz | Start time before the last confirmed reschedule |
| `CreatedAt` | timestamptz | UTC |

### PasswordResetTokens

| Column | Type | Notes |
|--------|------|-------|
| `Id` | uuid | Primary key |
| `UserId` | uuid | FK → Users (cascade delete) |
| `TokenHash` | varchar(64) | SHA-256 hex of raw token, unique index |
| `ExpiresAt` | timestamptz | UTC, default 1 hour from creation |
| `CreatedAt` | timestamptz | UTC |
| `UsedAt` | timestamptz | Null until token is consumed |

Raw reset tokens are never stored — only the hash. The plain token is sent by email and submitted once by the client.

### Notifications

In-app notifications for appointment events. Rows are created alongside email notifications for the same triggers (except new booking requests, which are email-only today).

| Column | Type | Notes |
|--------|------|-------|
| `Id` | uuid | Primary key |
| `UserId` | uuid | FK → Users (cascade delete) |
| `Type` | varchar(50) | `AppointmentConfirmed`, `AppointmentCancelled`, `RescheduleReceived`, or `RescheduleAccepted` |
| `Title` | varchar(200) | Short heading shown in the UI |
| `Message` | varchar(1000) | Full notification text |
| `AppointmentId` | uuid | FK → Appointments (set null on delete), optional |
| `IsRead` | boolean | Default `false` |
| `CreatedAt` | timestamptz | UTC |

Indexed on `(UserId, IsRead)` and `(UserId, CreatedAt)` for listing and unread counts.

### Ratings

Two-way ratings left after an appointment reaches a terminal state. Each participant may leave one rating per appointment.

| Column | Type | Notes |
|--------|------|-------|
| `Id` | uuid | Primary key |
| `AppointmentId` | uuid | FK → Appointments (cascade delete) |
| `ServiceId` | uuid | FK → Services (restrict); stored so per-service averages are cheap |
| `RaterId` | uuid | FK → Users (restrict); who left the rating |
| `RateeId` | uuid | FK → Users (restrict); who is being rated |
| `Direction` | integer | Enum: `CustomerToProvider` (0), `ProviderToCustomer` (1) |
| `Stars` | numeric(2,1) | Nullable. 0.5–5.0 in 0.5 steps; null when comment-only |
| `Comment` | varchar(1000) | Nullable |
| `CreatedAt` | timestamptz | UTC |
| `UpdatedAt` | timestamptz | UTC, bumped on edit |

- Unique index on `(AppointmentId, Direction)` — one rating per side per appointment.
- Index on `(RateeId, ServiceId, Direction)` — backs public per-service aggregation.
- Check constraint `CK_Rating_Stars_Range`: `Stars` is null or one of 0.5…5.0.
- Check constraint `CK_Rating_NotEmpty`: at least one of `Stars` or `Comment` is present.

A service's public average and reviews are scoped by `(RateeId = provider, ServiceId)` and only count `CustomerToProvider` ratings on **Completed** or **No-show** appointments, so a provider's two services keep separate ratings.

A customer's **overall rating** aggregates `ProviderToCustomer` ratings by `RateeId` (across all appointments/statuses); this powers the customer rating shown when a name is clicked and the account page's "Your ratings".

## Constraints

### Unique email and username

Each user must have a unique email address and username.

### Double-booking prevention

A PostgreSQL **exclusion constraint** prevents overlapping appointments for the same provider:

```
EX_Appointments_NoOverlap_PerProvider
```

Two **`Booked`** or **`Pending`** appointments for the same provider cannot overlap in time. Cancelled, completed, and no-show rows are excluded from the constraint.

The application also checks for overlaps before inserting or rescheduling, and catches the constraint violation as a fallback.

## Migrations

Migrations live in `src/App/Migrations/` and are applied on API startup via `ApplyMigrations()` in `Program.cs`.

| Migration | Description |
|-----------|-------------|
| `AddServicesAndAppointments` | Creates Users, Services, Appointments tables |
| `AddUserAuthFields` | Adds PasswordHash, Role, CreatedAt to Users; unique email index |
| `AddAppointmentDoubleBookingConstraint` | PostgreSQL exclusion constraint for provider overlap |
| `AddUsernameToUser` | Adds Username column with unique index |
| `AddPasswordResetTokens` | Creates PasswordResetTokens table |
| `AddPhoneNumberToUser` | Adds PhoneNumber column to Users |
| `AddProviderAvailability` | Creates ProviderAvailabilities table |
| `AddCategoryToService` | Adds Category column to Services |
| `AddProviderService` | Creates ProviderServices join table |
| `AddIsSuspendedToUser` | Adds IsSuspended column to Users |
| `AddCancellationReasonToAppointment` | Adds CancellationReason to Appointments |
| `IncludePendingInAppointmentOverlapConstraint` | Extends overlap constraint to Pending bookings |
| `AddPendingRescheduleFields` | Adds pending reschedule columns |
| `AddCountryAndCityToService` | Adds Country and City to Services |
| `AddAppointmentRescheduleHistory` | Adds PreviousStartTime and reschedule count |
| `SplitAppointmentRescheduleCounts` | Splits count into provider/customer columns |
| `AddPendingRescheduleFromConfirmedSlot` | Tracks whether reschedule started from a confirmed slot |
| `AddCancelledByUserIdToAppointment` | Records who cancelled an appointment |
| `AddServiceIdToProviderAvailability` | Scopes availability to individual services; migrates existing provider-wide slots to each active service |
| `AddTimeZoneToUser` | Adds IANA `TimeZoneId` to Users |
| `AddNotifications` | Creates Notifications table |
| `AddIsRemoteToService` | Adds `IsRemote` boolean to Services (default `false`) |
| `AddRatings` | Creates Ratings table with unique/aggregation indexes and star/non-empty check constraints |

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

## Demo seed data

On every API startup, `DatabaseSeeder.SeedAsync` runs after migrations. It is **idempotent**: if the marker user `dr.smith@appointweb.dev` already exists, seeding is skipped.

The seed creates:

- **Providers:** `dr.smith`, `coach.mike`, `bella.beauty`, `tutor.tom` (`*@appointweb.dev`)
- **Customers:** `emma`, `frank`, `grace`, `henry`, `iris` (`*@appointweb.dev`)
- **Services:** dental, fitness, beauty, guitar lesson, etc.
- **Sample appointments** across all statuses, ratings, and notifications

| Setting | Value |
|---------|-------|
| Demo password | `Password123!` |
| Marker email | `dr.smith@appointweb.dev` |
| Default timezone | `Europe/Sofia` |

User accounts created via **Register** on production are stored alongside seed data. The live demo also includes manually registered users.

To run seeding only (without starting the web server):

```bash
cd src/App
dotnet run -- seed
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
SELECT "Id", "Username", "Email", "Role", "IsSuspended", "CreatedAt" FROM "Users";

-- List services
SELECT * FROM "Services";

-- List provider offerings
SELECT ps."ProviderId", u."Username", s."Name"
FROM "ProviderServices" ps
JOIN "Users" u ON u."Id" = ps."ProviderId"
JOIN "Services" s ON s."Id" = ps."ServiceId"
WHERE ps."IsActive" = true;

-- List provider availability by service
SELECT ps."ProviderId", u."Username", s."Name", pa."DayOfWeek", pa."StartTime", pa."EndTime"
FROM "ProviderAvailabilities" pa
JOIN "Services" s ON s."Id" = pa."ServiceId"
JOIN "ProviderServices" ps ON ps."ServiceId" = s."Id" AND ps."ProviderId" = pa."ProviderId"
JOIN "Users" u ON u."Id" = pa."ProviderId"
ORDER BY s."Name", pa."DayOfWeek", pa."StartTime";

-- List appointments
SELECT * FROM "Appointments";
```
