# Frontend

The frontend is a React SPA located in `src/App/ClientApp/`. It uses Vite as the dev server and build tool.

## Tech stack

| Library | Purpose |
|---------|---------|
| React 19 | UI components |
| TypeScript | Type safety |
| Vite | Dev server and bundler |
| React Router | Client-side routing |
| Redux Toolkit | Global auth state |
| Axios | HTTP client |
| SCSS | Styling |

## Folder structure

```
ClientApp/
├── public/
│   └── favicon.png              # Browser tab icon
├── src/
│   ├── api/
│   │   ├── api.ts               # Axios instance + JWT interceptor
│   │   └── auth.ts              # Login, register API calls
│   ├── assets/images/
│   │   ├── logo.png             # Navbar logo
│   │   ├── favicon.png          # Source favicon (copied to public/)
│   │   └── welcome-bg.png       # Welcome page banner image
│   ├── components/
│   │   ├── Layout/
│   │   │   └── Layout.tsx       # Shared layout (navbar + page content)
│   │   └── Navbar/
│   │       ├── Navbar.tsx       # Sticky nav with auth-aware menu
│   │       └── Navbar.scss
│   ├── features/
│   │   └── auth/
│   │       └── authSlice.ts     # Redux auth state
│   ├── pages/
│   │   ├── Home.tsx             # Welcome landing page
│   │   ├── Login.tsx            # Login form
│   │   ├── Register.tsx         # Registration form (username required)
│   │   ├── Account.tsx          # Account page (placeholder)
│   │   ├── Appointments.tsx     # Appointments page (placeholder)
│   │   ├── AdminPanel.tsx       # Admin panel (placeholder)
│   │   ├── Auth.scss            # Shared auth form styles
│   │   ├── Home.scss            # Welcome page styles
│   │   └── Page.scss            # Shared placeholder page styles
│   ├── store/
│   │   ├── store.ts             # Redux store configuration
│   │   └── hooks.ts             # Typed useAppDispatch / useAppSelector
│   ├── types/
│   │   └── auth.ts              # TypeScript interfaces for auth DTOs
│   ├── utils/
│   │   ├── jwt.ts               # JWT payload decoder
│   │   └── formatDisplayName.ts # Capitalize username for display
│   ├── App.tsx                  # Router setup
│   ├── main.tsx                 # Entry point (Provider wrapper)
│   └── index.scss               # Global styles & brand color variables
```

## Routing

Defined in `App.tsx`. All routes share the `Layout` component (sticky navbar).

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Home` | Welcome landing page with banner image |
| `/login` | `Login` | Login form |
| `/register` | `Register` | Registration form |
| `/account` | `Account` | Account page (placeholder) |
| `/appointments` | `Appointments` | Appointments page (placeholder) |
| `/admin` | `AdminPanel` | Admin panel (placeholder) |

## Layout & navbar

```
┌──────────────────────────────────────────────────────────┐
│  Navbar (sticky, light teal gradient)                    │
│  [Logo]                    [Login] [Register]  — or —  │
│                            [Avatar Username ▾]           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Page content (via React Router Outlet)                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

The navbar is always visible on every page.

### Logged out
- Shows **Login** and **Register** links

### Logged in
- Shows username with avatar initial in a pill button
- Hover opens dropdown menu:
  - **Admin Panel** → `/admin` (only if `role === "Admin"`)
  - **Account** → `/account`
  - **Appointments** → `/appointments`
  - **Logout** (clears auth state)

The username is displayed with the first letter capitalized.

## Welcome page

The home page (`/`) is a welcome landing page with:

- A full-width banner image at the top (`assets/images/welcome-bg.png`)
- Welcome message and description
- Category tags (healthcare, sports, beauty, etc.)
- **Get started** / **Log in** buttons (hidden when already logged in)

## State management

Redux Toolkit manages auth state. See [Authentication](authentication.md) for details.

### Reading auth state in a component

```typescript
import { useAppSelector } from "../store/hooks";

function MyComponent() {
  const { accessToken, username, email, role } = useAppSelector(
    (state) => state.auth
  );
  const isLoggedIn = !!accessToken;
  const isAdmin = role === "Admin";
}
```

### Dispatching auth actions

```typescript
import { useAppDispatch } from "../store/hooks";
import { setCredentials, logout } from "../features/auth/authSlice";

const dispatch = useAppDispatch();

// After login or register — pass full AuthResponse from API
dispatch(setCredentials(response));

// Logout
dispatch(logout());
```

## API client

The axios instance in `src/api/api.ts` is configured with:

- **Base URL:** `http://localhost:8080`
- **JWT interceptor:** automatically attaches `Authorization: Bearer <token>` from `localStorage`

Auth-specific API calls (`login`, `register`) live in `src/api/auth.ts`.

## Styling & branding

The UI uses a **teal and slate** color palette matching the AppointWeb logo:

| Token | Color | Usage |
|-------|-------|-------|
| `--color-brand-slate` | `#475569` | Body text, username |
| `--color-brand-teal` | `#06b6d4` | Primary accent, buttons, links |
| `--color-brand-mint` | `#2dd4bf` | Gradient accents |

- Global styles and CSS variables in `index.scss`
- Component styles use SCSS with nesting
- Login and Register share `Auth.scss`
- Headings on welcome/auth pages use a slate → teal gradient

## Scripts

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # TypeScript check + production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

## Environment

The API base URL is hardcoded in `src/api/api.ts` as `http://localhost:8080` for local development. For other environments, this would be moved to an environment variable (e.g. `VITE_API_URL`).

## Not yet implemented

- Route guards (redirect unauthenticated users away from protected pages)
- Admin panel content and API-side `[Authorize(Roles = "Admin")]`
- Account and Appointments page functionality
- Appointment booking UI on the frontend
- Auth guard on `/admin` route
