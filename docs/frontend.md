# Frontend

The frontend is a React SPA located in `src/App/ClientApp/`. It uses Vite as the dev server and build tool.

## Tech stack

| Library | Purpose |
|---------|---------|
| React 19 | UI components |
| TypeScript | Type safety |
| Vite | Dev server and bundler |
| React Router | Client-side routing |
| Redux Toolkit | Global state (auth) |
| Axios | HTTP client |
| SCSS | Styling |

## Folder structure

```
ClientApp/src/
├── api/
│   ├── api.ts              # Axios instance + JWT interceptor
│   ├── auth.ts             # Login, register, forgot/reset password
│   ├── account.ts          # Profile and account settings
│   ├── admin.ts            # Admin user management
│   ├── appointments.ts     # Appointment CRUD actions
│   ├── catalog.ts          # Public service catalog
│   ├── notifications.ts    # In-app notification list and read state
│   ├── provider.ts         # Provider services and availability
│   └── errors.ts           # API error message helper
├── components/
│   ├── Layout/             # Shared layout (navbar + page content)
│   ├── Navbar/             # Sticky navigation with role-based links
│   ├── Notifications/      # Notification bell and dropdown panel
│   ├── ProtectedRoute/     # Auth and role guards
│   ├── Account/            # Account settings fields and icons
│   ├── Admin/              # Admin panel tables, cards, modals
│   ├── Appointments/       # Appointment cards, cancel dialog, reschedule meta
│   ├── ConfirmDialog/      # Reusable confirmation dialog
│   └── Provider/           # Provider panel: stats, tabs, service cards, modals, skeleton
├── constants/
│   └── roles.ts            # Role constants and labels
├── features/
│   └── auth/
│       └── authSlice.ts    # Redux auth state
├── hooks/
│   ├── useAsyncData.ts     # Generic async data loading hook
│   ├── useAccountSettings.ts
│   ├── useNotifications.ts # Poll and manage in-app notifications
│   └── useProviderPanelData.ts  # Provider appointments + services data
├── pages/
│   ├── Home.tsx            # Landing page + service catalog
│   ├── ServiceDetail.tsx   # Service detail and booking flow
│   ├── Appointments.tsx    # User appointment list
│   ├── Account.tsx         # Account settings
│   ├── ProviderPanel.tsx   # Provider dashboard
│   ├── AdminPanel.tsx      # Admin user management
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── ForgotPassword.tsx
│   ├── ResetPassword.tsx
│   └── *.scss              # Page-specific styles
├── store/
│   ├── store.ts            # Redux store configuration
│   └── hooks.ts            # Typed useAppDispatch / useAppSelector
├── types/                  # TypeScript interfaces for API DTOs
│   └── notifications.ts    # Notification and unread-count types
├── utils/                  # Formatting, filters, appointment helpers
│   ├── appointmentFilters.ts       # Customer appointment tab filters
│   ├── appointmentCancellationUtils.ts
│   ├── appointmentRescheduleUtils.ts
│   ├── appointmentOutcomeUtils.ts
│   ├── providerPanelUtils.ts       # Provider stats and appointment grouping
│   └── getTimeGreeting.ts          # Time-of-day greeting from browser timezone
├── App.tsx                 # Router setup
├── main.tsx                # Entry point (Provider wrapper)
└── index.scss              # Global styles
```

## Routing

Defined in `App.tsx`. All routes share the `Layout` component (sticky navbar).

| Path | Component | Access | Description |
|------|-----------|--------|-------------|
| `/` | `Home` | Public | Landing page and browsable service catalog |
| `/book/:providerId/:serviceId` | `ServiceDetail` | Public | Service detail and booking flow |
| `/login` | `Login` | Public | Login form |
| `/register` | `Register` | Public | Registration form (Customer or Provider) |
| `/forgot-password` | `ForgotPassword` | Public | Request password reset email |
| `/reset-password` | `ResetPassword` | Public | Set new password from email token |
| `/account` | `Account` | Authenticated | Profile and account settings |
| `/appointments` | `Appointments` | Authenticated | View and manage appointments |
| `/provider` | `ProviderPanel` | Provider, Admin | Provider dashboard |
| `/admin` | `AdminPanel` | Admin | User management |

Protected routes use the `ProtectedRoute` component, which redirects unauthenticated users to `/login` and unauthorized roles to `/`.

## Layout

```
┌─────────────────────────────────────────────┐
│  Navbar (sticky)                            │
│  [Logo]         [Bell] [User menu / Auth]   │
├─────────────────────────────────────────────┤
│                                             │
│  Page content (via React Router Outlet)     │
│                                             │
└─────────────────────────────────────────────┘
```

The navbar adapts based on auth state and role:

- **Logged out:** Login and Register links
- **Logged in:** Notification bell (with unread badge) plus user dropdown with links to Account, Appointments, and role-specific pages (Provider Panel, Admin Panel)
- **Logout:** Clears Redux state and `localStorage`

### Notifications (`NotificationBell`)

- Rendered in the navbar for logged-in users, to the left of the profile menu
- Polls `GET /api/notifications` and `GET /api/notifications/unread-count` every 30 seconds via `useNotifications`
- Dropdown shows recent notifications with title, message, and relative time
- Unread items are highlighted; clicking one marks it read and navigates to `/appointments` (customers) or `/provider` (providers/admins)
- **Mark all read** calls `PATCH /api/notifications/read-all`

## Key pages

### Home (`/`)

- Welcome section with sign-up prompts for guests
- Service catalog loaded from `GET /api/catalog`
- Logged-in providers do not see their own listings in the browse grid

### Service detail (`/book/:providerId/:serviceId`)

- Shows service info, provider, duration, and price
- Logged-in users can book a time slot
- Providers viewing their own listing see a preview message instead of the booking form

### Appointments (`/appointments`)

- Lists the user's appointments from `GET /api/appointments`
- Filter tabs: **Upcoming**, **Pending**, **Cancelled**, **Past**
- **Upcoming** and **Pending** tabs show count badges when greater than zero
- Supports cancel, reschedule request/accept, and outcome actions (Completed / NoShow)
- Cancelled appointments show who cancelled and the cancellation reason (when available)

### Provider panel (`/provider`)

Glass-style dashboard for providers with animated stat cards, tabbed appointment views, and a dedicated services area.

**Header**

- Time-based greeting (morning / afternoon / evening) using the browser's IANA timezone via `Intl` (see `utils/getTimeGreeting.ts`)
- Provider name and quick access to **My services**

**Stats grid** (clickable)

- **Upcoming**, **Today**, **Pending**, **Listed services** — jump to the matching appointment tab or services view
- Stat values animate on load; skeleton placeholders while data loads

**Appointment tabs**

- **Upcoming** — confirmed future bookings
- **Pending** — new booking requests and open reschedule proposals (badge when count > 0)
- **Past** — completed, no-show, and appointments needing an outcome
- **Cancelled** — cancelled bookings with cancellation details
- Sliding tab indicator on desktop; directional slide transitions when switching tabs

**My services**

- Section header with **+ Add service**
- Service cards show catalog info with **Edit**, **Hours**, and **Preview** actions
- **Edit** opens a single modal for all service fields (title, description, category, location, duration, price)
- **Hours** opens a per-service availability editor (`EditProviderAvailabilityModal`) — each listing has its own weekly schedule
- **Preview** links to the public booking page
- Dashed **Add service** card at the end of the grid for quick creation
- Data: `GET /api/provider/services`, `GET/PUT /api/provider/services/{serviceId}/availability`

**Provider actions on appointments**

- Confirm bookings, cancel, request/accept reschedules, mark outcomes
- Data: `GET /api/provider/appointments`

### Admin panel (`/admin`)

- Search and filter users by role and suspension status
- Edit user details, suspend/unsuspend, delete users

### Account (`/account`)

- Update email, username, password, and phone number
- Delete account

## State management

Redux Toolkit manages auth state. See [Authentication](authentication.md) for details.

### Reading auth state in a component

```typescript
import { useAppSelector } from "../store/hooks";

function MyComponent() {
  const { accessToken, userId, email, username, role } = useAppSelector(
    (state) => state.auth
  );
  const isLoggedIn = !!accessToken;
}
```

### Dispatching auth actions

```typescript
import { useAppDispatch } from "../store/hooks";
import { setCredentials, logout } from "../features/auth/authSlice";

const dispatch = useAppDispatch();

// After login or register
dispatch(setCredentials(response));

// Logout
dispatch(logout());
```

## API client

The axios instance in `src/api/api.ts` is configured with:

- **Base URL:** `http://localhost:8080`
- **JWT interceptor:** automatically attaches `Authorization: Bearer <token>` from `localStorage`

Domain-specific API calls are split across `src/api/*.ts` modules. Provider availability uses per-service endpoints:

- `getProviderServiceAvailability(serviceId)` → `GET /api/provider/services/{serviceId}/availability`
- `updateProviderServiceAvailability(serviceId, slots)` → `PUT /api/provider/services/{serviceId}/availability`

## Styling

- Global styles in `index.scss` (CSS custom properties for brand colors)
- Component and page styles use SCSS with nesting
- Shared breakpoint mixins in `styles/_breakpoints.scss`
- Custom-styled buttons (filters, stat cards, tabs) override global `button` hover styles to avoid the default teal fill

## Scripts

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # TypeScript check + production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

## Environment

The API base URL is hardcoded in `src/api/api.ts` as `http://localhost:8080` for local development. For other environments, this would be moved to an environment variable (e.g. `VITE_API_URL`).
