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

## Feature overview

| Area | Highlights |
|------|------------|
| Booking | Catalog browse → book → provider confirms → customer notified by email and in-app → appointment is active |
| Reschedule | Either party proposes a new time; the other accepts; requester notified by email and in-app; tracked separately from initial pending time changes |
| Cancellation | Records who cancelled and optional reason; emails and in-app notification to the other party |
| Notifications | Bell icon in navbar with unread badge; appointment confirmed, cancelled, reschedule received, and reschedule accepted |
| Provider panel | Dashboard with stats, appointment tabs, per-service booking hours, and service catalog management |
| Admin | User search, edit, suspend, delete |

## Quick links

- **Run locally:** [README → Local setup](../README.md#local-setup)
- **API base URL:** `http://localhost:8080`
- **Frontend URL:** `http://localhost:5173`
- **Backend config template:** `src/App/appsettings.Development.example.json`
