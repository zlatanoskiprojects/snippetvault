# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

SnippetVault is a full-stack code snippet manager. Users authenticate, then create/organize snippets into collections, tag them, comment on them, track version history, and share individual snippets publicly via share tokens. The repo is a monorepo with two independent apps: `backend/` (Express + TypeScript + PostgreSQL/Drizzle) and `frontend/` (React + TypeScript + Vite).

## Commands

### Backend (`cd backend`)
```bash
npm run dev        # start with nodemon + ts-node (auto-restart on changes)
npm start          # run compiled build/index.js
npm run build      # tsc compile to build/
npm run typecheck  # tsc --noEmit
```

### Frontend (`cd frontend`)
```bash
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # production build (vite build — no tsc step, so run tsc manually to typecheck)
npm run lint     # ESLint
npm run preview  # preview production build
```

There are no tests yet.

## Environment Setup

Two `.env` files are involved:

- **Repo root `.env`** — consumed by `docker-compose.yml` (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`). `docker compose up -d db` starts Postgres 16 on host port **5433** (container 5432) and seeds it from `backend/drizzle/0000_wise_shen.sql` on first start. See `quickstart.md` for the full local-dev walkthrough.
- **`backend/.env`** — used by the app:
```
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5433/snippetvault
CLIENT_URL=http://localhost:5173
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=placeholder
GOOGLE_CLIENT_SECRET=placeholder
GITHUB_CLIENT_ID=placeholder
GITHUB_CLIENT_SECRET=placeholder
```
Social provider credentials are optional — `backend/src/lib/auth.ts` only registers a Google/GitHub provider when both its env vars are set and not the literal string `placeholder`. `backend/.env.example` is stale (it still lists `SESSION_SECRET`, which is no longer used).

Schema is defined in Drizzle (`backend/src/db/schema.ts`); `backend/drizzle.config.ts` + `backend/drizzle/` hold generated migrations. The Drizzle schema is authoritative.

The root `package.json`/`pnpm-lock.yaml` only hold stray CodeMirror deps — the real manifests are `backend/package.json` and `frontend/package.json` (installed with npm).

## Architecture

### Backend

- **Entry point**: `backend/src/index.ts` — applies `helmet` + the CORS allowlist, mounts the Better Auth handler at `/api/auth/{*any}` **before** `express.json()` (Better Auth needs the raw body — keep that ordering), then mounts resource routers under `/api/`, then serves the built frontend (`dist/frontend-build`) as static files with a catch-all route, so the backend can serve the SPA in production
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