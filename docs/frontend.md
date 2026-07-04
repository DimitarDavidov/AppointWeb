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
│   └── auth.ts             # Login, register, forgot/reset password API calls
├── components/
│   ├── Layout/
│   │   └── Layout.tsx      # Shared layout (navbar + page content)
│   └── Navbar/
│       ├── Navbar.tsx      # Sticky navigation bar
│       └── Navbar.scss
├── features/
│   └── auth/
│       └── authSlice.ts    # Redux auth state
├── pages/
│   ├── Home.tsx            # Home page
│   ├── Login.tsx           # Login form
│   ├── Register.tsx        # Registration form
│   ├── ForgotPassword.tsx  # Request reset email
│   ├── ResetPassword.tsx   # Set new password from email token
│   └── Auth.scss           # Shared auth page styles
├── store/
│   ├── store.ts            # Redux store configuration
│   └── hooks.ts            # Typed useAppDispatch / useAppSelector
├── types/
│   └── auth.ts             # TypeScript interfaces for auth DTOs
├── utils/
│   └── jwt.ts              # JWT payload decoder
├── App.tsx                 # Router setup
├── main.tsx                # Entry point (Provider wrapper)
└── index.scss              # Global styles
```

## Routing

Defined in `App.tsx`. All routes share the `Layout` component (sticky navbar).

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Home` | Landing page |
| `/login` | `Login` | Login form |
| `/register` | `Register` | Registration form |
| `/forgot-password` | `ForgotPassword` | Request password reset email |
| `/reset-password` | `ResetPassword` | New password form (requires `?token=` query param) |

## Layout

```
┌─────────────────────────────────────────────┐
│  Navbar (sticky)                            │
│  [Appoint]              [Login] [Logout] [Register] │
├─────────────────────────────────────────────┤
│                                             │
│  Page content (via React Router Outlet)     │
│                                             │
└─────────────────────────────────────────────┘
```

The navbar is always visible regardless of which page the user is on.

## State management

Redux Toolkit manages auth state. See [Authentication](authentication.md) for details.

### Reading auth state in a component

```typescript
import { useAppSelector } from "../store/hooks";

function MyComponent() {
  const { accessToken, email, role } = useAppSelector((state) => state.auth);
  const isLoggedIn = !!accessToken;
}
```

### Dispatching auth actions

```typescript
import { useAppDispatch } from "../store/hooks";
import { setCredentials, logout } from "../features/auth/authSlice";

const dispatch = useAppDispatch();

// After login
dispatch(setCredentials(token));

// Logout
dispatch(logout());
```

## API client

The axios instance in `src/api/api.ts` is configured with:

- **Base URL:** `http://localhost:8080`
- **JWT interceptor:** automatically attaches `Authorization: Bearer <token>` from `localStorage`

Auth-specific API calls (`login`, `register`) live in `src/api/auth.ts`.

## Styling

- Global styles in `index.scss` (dark/light mode via `prefers-color-scheme`)
- Component styles use SCSS with nesting (e.g. `Navbar.scss`)
- Login and Register share `Auth.scss` for consistent form layout

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

- Logout button wired to `dispatch(logout())`
- Conditional navbar (hide Login/Register when logged in)
- Admin panel route and role-based UI
- Appointment booking page
- Auth guard (redirect to login for protected pages)
