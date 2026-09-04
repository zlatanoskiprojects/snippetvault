# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

SnippetVault is a full-stack code snippet manager. Users authenticate, then create/organize snippets into collections, tag them, comment on them, track version history, and share individual snippets publicly via share tokens. The repo is a monorepo with two independent apps: `backend/` (Express + TypeScript + PostgreSQL/Drizzle) and `frontend/` (React + TypeScript + Vite).

## Commands

### Backend (`cd backend`)
```bash
pnpm dev        # start with nodemon + ts-node (auto-restart on changes)
pnpm start      # run compiled build/index.js
pnpm build      # tsc compile to build/
pnpm typecheck  # tsc --noEmit
```

### Frontend (`cd frontend`)
```bash
pnpm dev                    # Vite dev server (http://localhost:5173)
pnpm build                  # production build
pnpm exec tsc --noEmit      # typecheck
pnpm lint                   # ESLint
pnpm preview                # preview production build
```

There are no tests yet.

## Environment Setup

- **Repo root `.env`** — private configuration consumed by Docker Compose. The local stack uses `docker-compose.yml`; the public HTTPS stack uses `docker-compose.selfhost.yml`. These modes require different URL values and should not share one unchanged `.env`.
- **`.env.selfhost.example`** — committed template for the public self-hosted stack. PostgreSQL passwords must contain at least 32 cryptographically random characters from `A-Z`, `a-z`, `0-9`, `_`, and `-` because they are embedded directly in `DATABASE_URL`.
- **`backend/.env`** — private environment used when running or deploying the backend outside Docker Compose. Do not commit or copy it into Docker images.
- **`backend/.env.example`** — documentation for environment variables understood by the backend.
- **`frontend/.env.production`** — official `snippetvault.me` frontend build configuration. Docker self-hosted builds use the `VITE_API_URL=/api` build argument instead.

`docker compose up --build` starts PostgreSQL, runs the one-shot Drizzle `migrate` service, starts the private backend after migrations succeed, and serves the frontend at `http://localhost:8080`. PostgreSQL and the backend are not published to host ports. The HTTPS stack uses `docker compose -f docker-compose.selfhost.yml up -d --build` and publishes only ports 80 and 443 through the frontend Caddy server.

Social provider credentials are optional — `backend/src/lib/auth.ts` only registers a Google/GitHub provider when both its environment variables are set and are not the literal string `placeholder`.

Schema is defined in Drizzle (`backend/src/db/schema.ts`); `backend/drizzle.config.ts` + `backend/drizzle/` hold generated migrations. The Drizzle schema is authoritative.

The root `package.json`/`pnpm-lock.yaml` only hold stray CodeMirror dependencies. Install the backend and frontend independently with pnpm using their respective manifests and lockfiles.

## Architecture

### Backend

- **Entry point**: `backend/src/index.ts` — applies `helmet` + the CORS allowlist, exposes `GET /api/health`, mounts the Better Auth handler at `/api/auth/{*any}` **before** `express.json()` (Better Auth needs the raw body — keep that ordering), then mounts resource routers under `/api/`. It does not serve the frontend; the official frontend is deployed separately and Docker builds serve it through Caddy
- **Database**: `backend/src/lib/db.ts` exports a Drizzle instance (`db`, default export) wrapping a `pg` `Pool`. Every route imports `db` from `../lib/db` and builds queries with Drizzle's query builder (`eq`, `and`, `or`, `ilike`, `sql`, etc. from `drizzle-orm`) — no raw SQL strings except inside `sql\`...\`` fragments
- **Schema ↔ API casing convention**: Drizzle table columns are camelCase (`userId`, `collectionId`, `createdAt`). Every route maps query results through a local `mapX`/`mapXWithY` function that translates fields to snake_case before sending JSON (`user_id`, `collection_id`, `created_at`) — the wire format is intentionally snake_case even though the ORM layer is camelCase. Keep new endpoints consistent with this
- **Auth**: [Better Auth](https://better-auth.com) (`better-auth` package), session-based. Configured in `backend/src/lib/auth.ts`: Drizzle adapter (`provider: 'pg'`, serial integer IDs), email+password enabled, optional Google/GitHub social providers, and custom field mapping onto the existing `users` table (`name`→`displayName`, `image`→`avatarUrl`, `createdAt`→`registeredAt`) plus a `databaseHooks.user.create.before` hook that derives `username` from the signup name. Auth state lives in the `auth_session`/`auth_account`/`auth_verification` tables. `backend/src/middleware/authMiddleware.ts` resolves the session via `auth.api.getSession(fromNodeHeaders(req.headers))` and sets `req.userId` (a `number`) for downstream handlers. There is no custom `routes/auth.ts` — Better Auth serves all `/api/auth/*` endpoints itself. (`express-session`, `connect-pg-simple`, and `bcryptjs` remain in `package.json` but are vestigial — do not build on them)
- **Routes**: One file per resource under `backend/src/routes/` (`snippets`, `collections`, `tags`, `comments`, `aiSettings`, `profile`, `share`). All routes except `/api/auth/*` and `/api/share/:token` require `authMiddleware`. Every mutation route runs `express-validator` middleware first, then checks `validationResult(req)` at the top of the handler
- **Validators**: Defined in `backend/src/validators/` and imported as `ValidationChain[]` arrays into the route files. The allowed snippet languages are the shared `SUPPORTED_LANGUAGES` const, duplicated in `backend/src/constants/languages.ts` and `frontend/src/constants/languages.ts` — keep both in sync
- **Versioning**: `snippet_version` rows are created lazily — only when a `PATCH` actually changes `code` and that exact code isn't already saved as a prior version (see the `shouldSaveVersion` logic in `snippets.ts`). Restoring a version snapshots the current code as a new version first if it differs
- **Public sharing**: `snippet.visibility` is `'private' | 'public'`. When a snippet is created as (or patched to) public, a `share_token` is generated via `crypto.randomBytes(24).toString('base64url')`; an existing token is reused when toggling back to public. `GET /api/share/:token` (in `routes/share.ts`) is the only unauthenticated resource endpoint — it returns the snippet only if `visibility = 'public'`, plus an `owner_name` (the owner's `displayName`, falling back to `username`) for attribution; it must never leak email, user id, or any other private field

API base URLs:
- `POST /api/auth/sign-up/email`, `POST /api/auth/sign-in/email`, `POST /api/auth/sign-out`, `POST /api/auth/sign-in/social`, `POST /api/auth/change-password`, `POST /api/auth/delete-user` — all handled by Better Auth, not by route files
- `GET|POST /api/snippets` (list supports `?q=` search over title/language/description/tag), `GET|PATCH|DELETE /api/snippets/:id`
- `GET /api/snippets/:id/versions`, `GET|DELETE /api/snippets/:id/versions/:versionId`, `POST /api/snippets/:id/versions/:versionId/restore`
- `GET|POST /api/collections`, `PATCH|DELETE /api/collections/:id`, `PATCH /api/collections/:id/snippets/:snippetId` (assign/unassign a snippet)
- `GET|POST /api/tags`, `GET /api/tags/:id`, `GET /api/tags/:id/snippets`, `POST|DELETE /api/tags/:id/snippets/:snippetId`
- `GET|POST|PATCH|DELETE` comments via `routes/comments.ts`, mounted at `/api` (`/api/snippets/:snippetId/comments`, `/api/comments/:id`)
- AI settings (`routes/aiSettings.ts`) are mounted at the bare `/api` root — `GET|POST|DELETE /api/` (a known quirk; the frontend calls `VITE_API_URL` directly). Stores per-user AI provider config; `api_key` is persisted as `apiKeyEnc`
- `GET|PATCH|DELETE /api/profile` (password change and account deletion go through the Better Auth endpoints above; `DELETE /api/profile` removes the app-side user row)
- `GET /api/share/:token` — public, no auth

### Frontend

- **Entry**: `frontend/src/main.tsx` → `App.tsx` (React Router routes: `/login`, `/register`, `/dashboard`, `/share/:token` (public shared-snippet view), `/docs` (redirects to `/docs/introduction`), `/docs/:slug`, catch-all → landing page)
- **Pages**: `src/pages/` — `LandingPage`, `LogIn`, `Register`, `Dashboard`, `CollectionsView`, `SearchView`, `NewSnippet`, `SnippetDetailPanel`, `ProfileView`, `SharedSnippetView`. The docs site lives under `src/pages/docs/` (`DocsPage`, `DocsLayout`, `DocsSidebar`, `DocsToc`, `DocBlocks`, `registry.tsx`) with per-topic content in `src/pages/docs/content/` (Introduction, QuickStart, Snippets, Collections, Tags, Comments, Search, PublicSharing, VersionHistory, ApiReference)
- **API layer**: `src/api/` — one module per resource, plus `types.ts` (shared response types) and `utils.ts` (`ApiError`, `throwIfNotOk` — every API function should parse errors through this so callers can check `err instanceof ApiError && err.status === ...`). All modules use `credentials: 'include'` so the session cookie is sent automatically. The backend base URL is read from `VITE_API_URL`. Auth calls (`src/api/auth.ts`, plus password-change/delete in `src/api/profile.ts`) hit Better Auth's REST endpoints with plain `fetch` — the `better-auth` client library is intentionally not used
- **Data fetching pattern**: custom hooks (`src/hooks/useSnippets.ts`, `useCollections.ts`, `useUser.ts`, `useToast.ts`) wrap `useState` + `useEffect` around the API modules, redirect to `/login` on a 401 `ApiError`, and surface other errors via local state or the toast context
- **Contexts**: `UserContext` (`src/contexts/UserContext.tsx`) owns the current-user profile plus save/change-password/delete-account actions; `ToastContext` provides app-wide toast notifications
- **Components**: `src/components/` (PascalCase `.tsx`) — includes `CodeEditor` (CodeMirror 6 wrapper), `VersionHistoryPanel`, `CollectionCard`/`CollectionDialog`, `SnippetList`/`SnippetRow`, `LanguageBadge`, `TagPill`, `Sidebar`, `TopBar`, `Toast`, `StatCard`, `ShareDialog` (visibility toggle + copy-link UI for public sharing); `src/components/landing/` holds the marketing landing page sections
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin) only — no other CSS frameworks or UI libraries. Interactive primitives live in `src/components/ui/` (Button, Input, Textarea, Badge, Card, Select, Field, Dialog, AlertDialog, Toast, Tabs, Spinner, Alert) built on `@base-ui/react` + `cva`, with `cn()` in `src/lib/utils.ts` — use these instead of writing inline primitives
- **Code editor**: `@uiw/react-codemirror` with per-language `@codemirror/lang-*` packages (JS, Python, CSS, HTML, SQL, C++, Go, Java, Rust) and the One Dark theme
- `frontend/src/data.ts` contains legacy mock data and is no longer imported anywhere — the app is fully wired to the API

### Database Schema

Tables (defined in `backend/src/db/schema.ts`): `users`, `auth_session`, `auth_account`, `auth_verification` (Better Auth tables), `collection`, `snippet`, `tag`, `snippet_tag` (junction), `snippet_version`, `comment`, `user_ai_settings`.
`snippet.collection_id` is nullable (snippets don't need a collection); `snippet` also carries `visibility` and a unique nullable `share_token`.
Tags are global (not per-user); ownership is enforced at the snippet level.
`user_ai_settings` has a unique constraint on `user_id` (one settings row per user); writes use Drizzle's `onConflictDoUpdate` as an upsert.
Password hashes live in `auth_account.password` (managed by Better Auth), not on `users`.

## Code Style

- Do not write comments anywhere in generated code — no inline comments, no block comments, no docstrings

## Security & Performance

This project and all future changes must follow OWASP best practices (OWASP Top 10 / ASVS) and standard performance practices. Concretely, for this codebase:

- **Injection**: All queries go through Drizzle's query builder — never interpolate user input into raw `sql\`...\`` fragments; use parameterized `sql` template placeholders if a raw fragment is unavoidable
- **Broken access control**: Every route handler must verify `req.userId` ownership in its `WHERE` clause (never trust a `:id` param alone); when reassigning a foreign key owned by another table (e.g. `collection_id` on a snippet), verify the referenced row belongs to `req.userId` before writing. The share endpoint must only ever expose snippets with `visibility = 'public'`, matched by token
- **Authentication/session**: Auth is delegated to Better Auth with server-side sessions in Postgres; never put auth state or secrets in a JWT/localStorage; never reimplement password handling outside Better Auth; passwords are never logged or returned in API responses
- **Input validation**: Every mutation route needs an `express-validator` chain checked via `validationResult(req)` before touching the DB — validate type, length, and allowed values (enums) server-side, not just in the frontend
- **Secrets management**: Never commit `.env` files or hardcode credentials/API keys; `user_ai_settings.api_key_enc` must stay encrypted at rest, never returned decrypted in a response
- **Output encoding / XSS**: React's default JSX escaping handles most of this — never use `dangerouslySetInnerHTML` on user-controlled content (snippet code, descriptions, comments) without sanitization
- **CORS**: Keep the `ALLOWED_ORIGINS` allowlist in `backend/src/index.ts` explicit; do not widen it to a wildcard or reflect arbitrary origins. Keep `trustedOrigins` in `backend/src/lib/auth.ts` in sync with it
- **Dependencies**: Avoid introducing packages with known CVEs; prefer well-maintained libraries already in use over adding new ones for the same purpose
- **Performance**: Add DB indexes on foreign key columns that are filtered/joined on (e.g. `snippet.user_id`, `snippet.collection_id`, `comment.snippet_id`); avoid N+1 query patterns — prefer a single joined Drizzle query over looping queries per row; keep payloads paginated for list endpoints rather than returning unbounded result sets

## Key Patterns

- All backend queries go through Drizzle (`drizzle-orm/node-postgres`) — no raw query strings in route handlers
- Route handlers always verify `user_id`/`userId` ownership in `WHERE` clauses to prevent horizontal privilege escalation
- When setting `collection_id` on a snippet — both on create (`POST /api/snippets`) and when reassigning it (`PATCH /api/snippets/:id`) — the handler manually checks that the collection belongs to `req.userId` before writing
- API responses are snake_case; Drizzle schema and TS variables are camelCase — translate at the route boundary via `mapX` helpers, not in the schema

## Repo-specific Codex setup

- `.Codex/agents/` defines specialized subagents: `db-migrator`, `backend-ts-converter`, `frontend-ts-converter`, `ts-migration-reviewer` (the MySQL→PostgreSQL and JS→TS migrations they were built for are complete, but they remain useful for follow-up type-safety or query cleanup passes), `frontend-ui-master` for frontend UI work, `code-auditor` for OWASP/performance sweeps, and a read-only `frontend-visual-tester` that verifies `frontend-ui-master`'s output across breakpoints
- `.Codex/hooks/block-tester-writer.sh` blocks `frontend-visual-tester` from ever using `Write`/`Edit`, even if its tool list is widened later — it must stay read-only so its review of `frontend-ui-master`'s output stays meaningful
- **Browser testing**: use the Playwright MCP tools (`mcp__playwright__*`) — Chrome is installed and working on this machine (since 2026-07-15). Only start Playwright testing when the user explicitly asks for it; never launch browsers or visual-test runs proactively after UI changes

## Frontend UI migration workflow (Base UI conversion)

When migrating a component to Base UI, fixing responsive/alignment issues, or doing any styling work, follow this loop instead of editing files directly:

1. Invoke `frontend-ui-master` with the specific component(s) and task.
2. Invoke `frontend-visual-tester` to verify the result across breakpoints.
3. Read the tester's report:
   - `RESULT: PASS` → move to the next component, or stop if done.
   - `RESULT: FAIL (n issues)` → invoke `frontend-ui-master` again with the tester's exact issue list as input.
4. Cap at 3 build→test rounds per component. If still failing after 3 rounds, stop and report the unresolved issues directly — do not keep looping silently.

Never edit component/JSX/TSX/Tailwind files directly in the main thread — always delegate to `frontend-ui-master` so the visual-tester's review stays meaningful. Track round count per component explicitly before each re-invocation.

## Frontend Design System

### Stack
- **Framework:** React 19 + Vite (`frontend/`)
- **Styling:** Tailwind CSS only — no CSS modules, no inline styles
- **Font:** Inter (loaded via Google Fonts in `index.html`)
- **Icons:** `lucide-react` — the one exception to "no other UI libraries"; use it instead of inline SVGs
- **Components:** PascalCase `.tsx` files in `frontend/src/components/`
- **No hardcoded pixel widths/heights** — use Tailwind responsive utilities and flex/grid

---

### Color Palette

```js
// Backgrounds (darkest → lightest)
'#0f0f0f'   // bg-app        — page root background
'#161616'   // bg-sidebar    — sidebar panel
'#1a1a1a'   // bg-card       — snippet row, secondary buttons
'#222222'   // bg-input      — search bar fill
'#242424'   // bg-tag        — tag pill fill

// Borders & Dividers
'#2a2a2a'   // border-subtle — all dividers, input borders

// Text hierarchy
'#ffffff'   // text-primary   — titles, active labels
'#9ba3af'   // text-secondary — inactive nav, descriptions
'#595e69'   // text-muted     — timestamps, counts, placeholders

// Accent (indigo)
'#6366f1'   // accent — logo bg, active nav highlight, primary CTA button
```

---

### Language Badge Color Map

Each code language has a colored dot + text + dark tinted background:

| Language | Dot & Text | Badge Background |
|----------|-----------|-----------------|
| TS       | `#3d77fc` | `#0b152d`       |
| PY       | `#22c55e` | `#062311`       |
| SH       | `#8c5af3` | `#19102c`       |
| SQL      | `#ef4444` | `#2b0c0c`       |
| JS       | `#fba528` | `#1f1200`       |

---

### Sidebar Tag Dot Colors

| Tag   | Dot Color |
|-------|-----------|
| react | `#3d77fc` |
| utils | `#22c55e` |
| auth  | `#8c5af3` |
| db    | `#fba528` |

---

### Design Conventions

- **Theme:** Dark only for now. Light mode toggle is UI placeholder — not implemented yet.
- **Border radius:** `rounded-md` (6px) for buttons/inputs, `rounded` (4px) for tags/badges
- **Interactive states:** `hover:bg-white/5 transition-colors duration-150` for nav items; `hover:bg-indigo-500` for primary CTA
- **Snippet rows:** `hover:bg-[#1f1f1f] cursor-pointer` — entire row is clickable
- **Responsiveness:** Sidebar collapses to a drawer on mobile (`lg:` breakpoint for persistent sidebar)
- **Truncation:** Always use `truncate` + `min-w-0` on flex children that hold text — never let rows overflow horizontally

## Deploy Agent — SnippetVault (AWS)

This section defines how Codex should behave when the user asks to **deploy**,
**redeploy**, or **check deployment health** for SnippetVault. Follow it exactly
when a deploy task is requested — do not improvise flags or skip steps.

### Scope & permissions

- You have permission to run `pnpm`, `aws`, `eb`, and `curl` commands without
  asking for confirmation on each one, as long as they match the commands
  listed below. Destructive or unlisted AWS commands (e.g. anything that
  deletes a resource, changes IAM, or modifies billing) always require
  explicit user approval first.
- These tasks require network access. If it is unavailable, stop and report
  the blocker instead of continuing with partial deployment steps.

### Environment

- Frontend: React/Vite app, S3 bucket `snippetvault-frontend` (region
  `eu-central-1`), CloudFront distribution `E2SYZG5BTAFCXA`, live at
  `https://snippetvault.me`.
- Backend: Node/Express on Elastic Beanstalk (Node 22 platform), live at
  `https://api.snippetvault.me`. Deployed via `eb deploy` from the backend
  repo root (must contain `.elasticbeanstalk/config.yml`).

### Task: Deploy frontend

Run, in order, and inspect the output of each before proceeding to the next:

1. `pnpm build` — must exit 0. If it fails, stop and report the build
   error; do not attempt to deploy a stale `dist/`.
2. `aws s3 sync dist/ s3://snippetvault-frontend --delete --no-cli-pager` —
   review the sync output; if it uploads 0 files, something is wrong (empty
   or missing `dist/`) — stop and report rather than invalidating a
   nonexistent deploy.
3. `aws cloudfront create-invalidation --distribution-id E2SYZG5BTAFCXA --paths "/*" --no-cli-pager` —
   capture the `Invalidation.Id` from the JSON output.
4. Poll `aws cloudfront get-invalidation --distribution-id E2SYZG5BTAFCXA --id <id> --no-cli-pager`
   every ~10s until `Invalidation.Status` is `Completed`. Don't poll more
   than once every 10 seconds. If it's not done after ~10 minutes, report
   that it's taking unusually long rather than continuing to poll silently.
5. `curl -s -o /dev/null -w "%{http_code}" https://snippetvault.me` — confirm
   `200`. If not, report the actual status code and do not assume success.

### Task: Deploy backend

1. Verify the Elastic Beanstalk environment defines every required backend
   variable, including `RESEND_API_KEY` and `EMAIL_FROM`, without printing
   their values. Stop if either is missing.
2. `eb deploy` from the backend repo root. Watch the output live — EB CLI
   streams deploy events; if it reports a failed health transition or a
   deployment abort, stop and surface the actual error text, don't just say
   "deploy failed."
3. Poll `eb status` every ~10s until it reports `Status: Ready` and
   `Health: Green`. If health is `Yellow` or `Red`, run `eb health --refresh`
   and/or `eb logs` to pull the actual cause before reporting back — don't
   just say "unhealthy," say why.
4. `curl -s -o /dev/null -w "%{http_code}" https://api.snippetvault.me/api/health`
   and confirm `200`.

### Task: Full deploy

Do frontend first, then backend, in the sequence above. If frontend fails,
stop — do not proceed to backend deploy.

### Task: Status check only (no deploy)

Run the `curl` checks against both URLs and `eb status`, report current
state. Do not run `pnpm build`, `s3 sync`, `eb deploy`, or create any
CloudFront invalidation for a status-only check.

### Reporting back

After any deploy task, give a short pass/fail summary per component
(frontend / backend), not a raw transcript of every command. Include the
actual HTTP status codes and EB health status in the summary. If something
failed, include the specific error, not just which step it was.
