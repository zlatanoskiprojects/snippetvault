# SnippetVault — Quickstart (Local Development)

This short guide helps you spin up the database and run the backend and frontend locally.

## Prerequisites
- Node.js 20+
- npm (or pnpm/yarn if you prefer; commands below use npm)
- Docker (for Postgres via `docker compose`)

## 1) Start the database (PostgreSQL via Docker)
The repo includes a `docker-compose.yml` that starts Postgres 16 and seeds the schema.

1. Create a `.env` at the repo root (used by Docker) with your desired Postgres credentials:
   ```env
   # ./.env (root)
   POSTGRES_DB=snippetvault
   POSTGRES_USER=sv_user
   POSTGRES_PASSWORD=sv_password
   ```
2. Start the DB:
   ```bash
   docker compose up -d db
   ```
   - Postgres listens on your machine at `localhost:5433` (container is 5432 → mapped to host 5433).
   - On first start, schema/migration SQL from `backend/drizzle/0000_wise_shen.sql` is applied automatically.

## 2) Configure the backend
1. Create a backend env file using the example:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Edit `backend/.env` and set at minimum:
   ```env
   PORT=3000
   # Match the credentials from your root .env and host port 5433
   DATABASE_URL=postgresql://sv_user:sv_password@localhost:5433/snippetvault
   SESSION_SECRET=replace-with-a-long-random-string
   CLIENT_URL=http://localhost:5173
   ```
3. Install and run the backend:
   ```bash
   cd backend
   npm ci
   npm run dev
   ```
   - Backend runs at `http://localhost:3000`
   - API base path: `http://localhost:3000/api`

## 3) Configure the frontend
1. Ensure the frontend knows where the API is. The default dev value is already set:
   - `frontend/.env`
     ```env
     VITE_API_URL=http://localhost:3000/api
     ```
   If the file doesn’t exist, create it with the line above.
2. Install and run the frontend:
   ```bash
   cd frontend
   npm ci
   npm run dev
   ```
   - Frontend runs at `http://localhost:5173`

## 4) Log in / Register
- Open `http://localhost:5173` in your browser.
- Use the UI to register and log in. Sessions are stored in Postgres.

## Troubleshooting
- "ECONNREFUSED" from backend → ensure Postgres is up on `localhost:5433` (`docker compose ps`).
- Auth/CORS issues in dev → confirm `CLIENT_URL=http://localhost:5173` in `backend/.env` and that you access the frontend via that URL.
- Frontend cannot reach API → verify `frontend/.env` has `VITE_API_URL=http://localhost:3000/api` and the backend is running.
