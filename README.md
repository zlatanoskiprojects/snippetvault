# SnippetVault

SnippetVault is a full-stack web app for storing, organizing, and managing personal code snippets with a modern editor experience and account-based access control.

## Purpose

The project solves a common developer problem: keeping reusable code organized and searchable in one place without losing ownership boundaries.  
It combines snippet CRUD, metadata organization, profile/account management, and a product-facing landing experience in one system.

## What Is Built

### Core product capabilities
- Session-based authentication (register, login, logout) with role persisted on user accounts.
- Snippet CRUD with:
  - language and visibility fields
  - collection assignment
  - tag association
  - full ownership checks on direct resource access
- Collection management (create, rename, delete, assign snippets).
- Global tags with snippet attach/detach flows.
- Search endpoint for snippet discovery.
- Version history for snippets (list, inspect, delete, restore).
- Snippet comments.
- Profile management (view/update), password change, and account deletion.
- Personal AI settings CRUD (provider/model/base URL/API key field storage).

### Frontend product surfaces
- Public landing page for unauthenticated users.
- Auth pages (`/login`, `/register`).
- Authenticated dashboard with views for snippets, collections, search, and profile.
- Snippet detail panel with editor preview, copy action, history access, edit/delete flows.

## Current Scope

This repository currently contains:
- `frontend/`: React 19 + Vite SPA
- `backend/`: Express + TypeScript API
- PostgreSQL schema/migrations via Drizzle
- `spec-kit/`: spec-driven planning artifacts for product direction

Spec-kit now drives feature planning in:
- `spec-kit/specs/002-snippetvault-core-product/spec.md`
- `spec-kit/specs/002-snippetvault-core-product/plan.md`
- `spec-kit/specs/002-snippetvault-core-product/tasks.md`

These docs reconcile required scope vs already-built behavior and define phased implementation work.

## What’s Next To Build

Based on the current spec-kit plan/tasks, the next major delivery areas are:
- Public snippet sharing via unique links (token generation + unauthenticated public-read flow).
- Predefined backend-enforced language allowlist (and aligned frontend picker).
- Search improvements (explicit sorting and full requirement alignment).
- Real administrator capabilities (admin-only routes, moderation, stats, user lifecycle controls).
- Non-functional follow-up:
  - performance/load verification
  - deployment/security documentation updates
  - self-hosted installation/integration documentation expansion

## Tech Stack

- Frontend: React 19, Vite, Tailwind, Base UI, CodeMirror
- Backend: Node.js, Express, TypeScript, express-session
- Database: PostgreSQL + Drizzle ORM

## Local Development

### Prerequisites
- Node.js 20+
- npm
- PostgreSQL

### 1) Configure backend environment
```bash
cp backend/.env.example backend/.env
```
Set at least:
- `DATABASE_URL`
- `SESSION_SECRET`

### 2) Install dependencies
```bash
cd frontend && npm ci
cd ../backend && npm ci
```

### 3) Run both apps
```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

Default local URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Validation Commands

```bash
# frontend
cd frontend
npm run lint
npm run build

# backend
cd backend
npm run typecheck
npm run build
```
