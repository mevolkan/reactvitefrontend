# create-fullstack-app

One command to get a FastAPI backend ([create-fastapi-app](https://github.com/SenZmaKi/create-fastapi-app)) **and** a
Vite + React + Tailwind + TypeScript frontend, with authentication already wired together.
This is meant to be a direct plugin to this [https://github.com/SenZmaKi/create-fastapi-app](https://github.com/SenZmaKi/create-fastapi-app) 

## Table of Contents

- [Prerequisites](#prerequisites)
- [Usage](#usage)
- [What Gets Generated](#what-gets-generated)
- [Frontend Features](#frontend-features)
- [How Auth Works](#how-auth-works)
- [Configuration](#configuration)
- [Production](#production)
- [Development](#development)

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ and npm
- [Git](https://git-scm.com/downloads)
- [uv](https://docs.astral.sh/uv/) (runs create-fastapi-app)
- [PostgreSQL](https://www.postgresql.org/download/), running (needed by the backend's database setup)

## Usage

Until it is published to npm, run it from a clone of this repo:

```bash
node /path/to/create-fullstack-app/bin/cli.js my-app
```

Once published:

```bash
npx create-fullstack-app my-app
```

The CLI first runs the interactive create-fastapi-app prompts. **Keep "Enable authentication system" set to Yes**,
since the frontend depends on it. It then generates the frontend and installs its dependencies.

Start both servers:

```bash
cd my-app
./dev.sh    # backend on :8000 (or your configured port), frontend on :5173
```

Open http://localhost:5173, register, and enter the verification code emailed by the backend.

### Flags

| Flag | Effect |
|---|---|
| `--skip-install` | Don't run `npm install` in `frontend/` |
| `--frontend-only` | Only generate the frontend (no `uv` needed) |
| `--help` | Show usage |

## What Gets Generated

```
my-app/
  backend/    FastAPI, PostgreSQL, Alembic, auth, Docker, tests (from create-fastapi-app)
  frontend/   Vite + React + Tailwind + TypeScript client
  dev.sh      Runs backend and frontend together (Ctrl+C stops both)
  README.md
```

The frontend `.env` is generated from the backend's `.env`: the app name becomes the page title and UI name, and
`FASTAPI_PORT` becomes the dev proxy target.

## Frontend Features

Mirrors the backend's `/api` routes:

| Feature | Backend route | Frontend route |
|---|---|---|
| Register (emails a code, starts a session) | `POST /auth/register` | `/register` |
| Login / logout | `POST /auth/login`, `/auth/logout` | `/login` |
| Current user, session restore on page load | `GET /auth/me` | `AuthProvider` |
| Email verification and resend | `/auth/verify-email`, `/auth/resend-verification-email` | `/verify-email` |
| Forgot / reset password | `/auth/forgot-password`, `/auth/reset-password` | `/forgot-password`, `/reset-password` |
| Health | `GET /health` | status badge on the home page |

Also included: route guards (logged-out, unverified, already-logged-in), a typed API client, readable messages for
FastAPI validation errors and 429 rate limits, a 404 page, and a Dockerfile with nginx.

Where to build:

- `frontend/src/App.tsx`: routes. Put your pages under `<ProtectedRoute verified />`.
- `frontend/src/lib/api.ts` and `types.ts`: add endpoints and DTOs next to the existing ones.
- `frontend/src/pages/Home.tsx`: replace with your app.

## How Auth Works

The backend returns the session token in the `Authorization: Bearer <token>` **response header** on login and
register. The frontend stores it in `localStorage` and sends it on every request. A 401 response clears the session
and sends the user to `/login`.

## Configuration

`frontend/.env`:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `/api` | Base URL of the backend's `/api` routes |
| `BACKEND_URL` | `http://localhost:8000` | Where the Vite dev proxy forwards `/api` |
| `VITE_APP_NAME` | from backend | Name shown in the UI |

In development, requests to `/api` are proxied by Vite, so no CORS setup is needed.

## Production

- **Docker:** `frontend/Dockerfile` builds the static site and serves it with nginx, proxying `/api/` to `BACKEND_URL`
  (default `http://backend:8000`). The browser stays same-origin, so CORS isn't needed.
- **Static hosting:** build with `npm run build`, deploy `dist/`, set `VITE_API_URL` to the backend's full `/api`
  URL, and add the frontend's origin to the backend's `CORS_ORIGINS`.

## Development

```
bin/cli.js   the scaffolder (no dependencies)
template/    the frontend that gets copied (placeholders: __APP_NAME__, __APP_NAME_UI__)
```

To test the CLI without running the real backend generator, point it at a stub:

```bash
CREATE_FASTAPI_APP_CMD="bash ./stub.sh" node bin/cli.js out
```

The stub should create a directory containing a `.env` with `APP_NAME`, `APP_NAME_UI` and `FASTAPI_PORT`.
