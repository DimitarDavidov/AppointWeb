# AppointWeb Documentation

Detailed documentation for the AppointWeb project. For a quick start guide, see the [main README](../README.md).

## Contents

| Document | Description |
|----------|-------------|
| [Architecture](architecture.md) | How the frontend, backend, and database fit together |
| [API Reference](api.md) | REST endpoints, request/response formats, and status codes |
| [Authentication](authentication.md) | JWT flow, roles, and frontend auth state |
| [Database](database.md) | Schema, entities, and relationships |
| [Frontend](frontend.md) | React app structure, routing, and state management |
| [Deployment](deployment.md) | Railway production setup, env vars, email (Resend) |

## Live demo

| Service | URL |
|---------|-----|
| Frontend | https://appointweb-frontend-production.up.railway.app |
| API | https://appointweb-production.up.railway.app |

## Feature overview

| Area | Highlights |
|------|------------|
| Catalog search | Home page search bar filters offerings client-side by service name, provider, category, description, and by city, country, or remote |
| Service location | Each listing is in-person (city + country) or remote; shown on catalog cards and service detail; providers set this when creating or editing a service |
| Booking | Catalog browse → book → provider confirms → customer notified by email and in-app → appointment is active |
| Reschedule | Either party proposes a new time; the other accepts; requester notified by email and in-app; tracked separately from initial pending time changes |
| Cancellation | Records who cancelled and optional reason; emails and in-app notification to the other party |
| Notifications | Bell icon in navbar with unread badge; appointment confirmed, cancelled, reschedule received, and reschedule accepted |
| Ratings & reviews | Two-way ratings after a terminal appointment (completed, no-show, cancelled); customers rate the service publicly, providers rate customers privately; stars (0.5–5) and comment both optional; per-service average and public reviews on the service page |
| Customer rating display | Clicking a customer's name (in the provider panel or on public service reviews) reveals that customer's overall rating — stars only, no comments |
| My ratings | The account page shows a user's own received ratings: customers see their rating as a customer; providers also see their rating as a provider; "Not rated yet" when empty |
| Provider panel | Dashboard with stats, appointment tabs, per-service booking hours, and service catalog management |
| Admin | User search, edit, suspend, delete |
| Admin insights | Each user row shows services offered, completed and cancelled counts, and (for providers) total revenue; provider rows expand into a per-service breakdown (price, bookings, completed, cancelled, revenue) |
| Admin CSV export | Any cancelled count is a pressable number that downloads a CSV — the user's cancelled appointments (user rows) or a single service's cancelled appointments (service breakdown rows) |

## Quick links

- **Run locally:** [README → Local setup](../README.md#local-setup)
- **Deploy to Railway:** [Deployment guide](deployment.md)
- **API base URL (local):** `http://localhost:8080`
- **API base URL (production):** `https://appointweb-production.up.railway.app`
- **Frontend URL (local):** `http://localhost:5173`
- **Frontend URL (production):** `https://appointweb-frontend-production.up.railway.app`
- **Backend config:** create `src/App/appsettings.Development.json` (gitignored) — template in [README](../README.md#2-configure-the-backend)
