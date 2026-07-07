# Implementation Plan: SnippetVault Core Product

**Branch**: `002-snippetvault-core-product` | **Date**: 2026-07-06 | **Spec**: `./spec.md`

**Input**: Feature specification from `spec-kit/specs/002-snippetvault-core-product/spec.md`

## Summary

Build a session-authenticated, single-tenant-per-account code snippet manager: users create/edit/delete snippets, organize them into collections and tags, search across them, retain and restore version history, comment on their own snippets, manage their profile/account lifecycle, and optionally configure a personal AI provider integration. An unauthenticated marketing landing page fronts the app. Backend is a REST API over Postgres; frontend is a single-page React app consuming it over session cookies.

## Technical Context

**Language/Version**: TypeScript throughout — backend on Node (Express), frontend on React 19 + Vite

**Primary Dependencies**:
- Backend: `express`, `drizzle-orm` (`drizzle-orm/node-postgres`) + `pg`, `express-session` + `connect-pg-simple` (session store), `bcryptjs` (password hashing), `express-validator` (input validation)
- Frontend: `react-router-dom` (routing), `@uiw/react-codemirror` + per-language `@codemirror/lang-*` packages (code editing/highlighting), `@base-ui/react` + `class-variance-authority` + `tailwind-merge`/`clsx` (UI primitives), Tailwind CSS v4 (`@tailwindcss/vite`)

**Storage**: PostgreSQL, schema managed via Drizzle (`backend/src/db/schema.ts`), migrations under `backend/drizzle/`

**Testing**: None exists yet. Out of scope for this plan to introduce a framework choice; acceptance scenarios in spec.md are the manual verification contract until a test suite is added as its own feature.

**Target Platform**: Single Express process serving both `/api/*` and the built frontend static bundle (`dist/frontend-build`) in production; separate ports (Vite dev server + `ts-node`) in local development

**Project Type**: Web application — two-directory monorepo (`backend/`, `frontend/`), no shared package layer between them (types are duplicated/hand-kept-in-sync at the API boundary, e.g. `frontend/src/api/types.ts`)

**Performance Goals**: Ownership-scoped queries remain index-backed as data grows (see spec-kit feature `001-owasp-security-hardening` for the concrete gap/fix); list endpoints return bounded pages rather than full table scans transferred to the client

**Constraints**: Session-based auth only (no JWT/localStorage token storage, per CLAUDE.md and User Story 1); wire format is snake_case while the ORM/TS layer is camelCase, translated at the route boundary via `mapX` helpers — this convention must hold for every new endpoint, not just existing ones; tags are intentionally global (not per-user); no inline styles or non-Tailwind CSS

**Scale/Scope**: Ten user stories (spec.md), single Postgres instance, no multi-region/multi-tenant considerations — this is a personal-scale tool, not a multi-org SaaS

## Constitution Check

*No ratified `constitution.md` exists yet for this project* (`.specify/memory/constitution.md` is still the template). The governing constraints instead come from CLAUDE.md, specifically:

- **Schema ↔ API casing convention** — every new route must map camelCase Drizzle results to snake_case JSON via a local `mapX`/`mapXWithY` function, never expose camelCase over the wire.
- **Ownership enforcement** — every mutating/reading route must filter by `req.userId` in its `WHERE` clause; reassigning a foreign key owned by another table must verify that referenced row's ownership before writing (this is FR-012 in spec.md, elevated from a CLAUDE.md pattern to a first-class product requirement).
- **Security & Performance checklist** — the OWASP/ASVS baseline in CLAUDE.md applies to every route built under this plan, not just the routes audited in feature `001-owasp-security-hardening`; new code introduced here (if any net-new route is needed) must be written compliant from the start rather than audited after the fact.
- **No comments in generated code** — applies to all implementation artifacts under this plan.

No violations to justify — this plan describes the existing architecture's shape as the target shape, so Complexity Tracking is omitted.

## Project Structure

### Documentation (this feature)

```text
spec-kit/specs/002-snippetvault-core-product/
├── spec.md
├── plan.md              # This file
└── tasks.md             # Run /speckit-tasks next for a granular checklist per user story
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── index.ts                    # App entry: mounts routers under /api, serves frontend build + SPA catch-all
│   ├── db/
│   │   ├── schema.ts                # users, collection, snippet, tag, snippet_tag, snippet_version, comment, user_ai_settings
│   │   └── index.ts (if present)
│   ├── lib/
│   │   └── db.ts                    # Drizzle instance + raw pg Pool (Pool also used by connect-pg-simple)
│   ├── middleware/
│   │   └── authMiddleware.ts        # reads req.session.userId → sets req.userId
│   ├── routes/
│   │   ├── auth.ts                  # US1
│   │   ├── snippets.ts              # US2, US6 (versions live under snippet routes per CLAUDE.md API list)
│   │   ├── collections.ts           # US3
│   │   ├── tags.ts                  # US4
│   │   ├── comments.ts              # US7
│   │   ├── profile.ts               # US8
│   │   └── aiSettings.ts            # US9
│   └── validators/                  # one file per resource, express-validator chains
│       └── *.ts
└── drizzle/                          # generated migrations

frontend/
├── src/
│   ├── main.tsx / App.tsx            # router: /login, /register, /dashboard, catch-all → LandingPage (US10)
│   ├── api/                          # one module per resource + types.ts + utils.ts (ApiError, throwIfNotOk)
│   ├── hooks/
│   │   ├── useSnippets.ts            # US2, US5 (search/filter), US6 (versions)
│   │   ├── useCollections.ts         # US3
│   │   └── useUser.ts                # US1, US8
│   ├── contexts/
│   │   ├── UserContext.tsx           # US1, US8
│   │   └── ToastContext.tsx          # cross-cutting UI feedback
│   ├── pages/
│   │   ├── LogIn.tsx, Register.tsx   # US1
│   │   ├── Dashboard.tsx             # US2 overview
│   │   ├── CollectionsView.tsx       # US3
│   │   ├── SearchView.tsx            # US5
│   │   ├── NewSnippet.tsx            # US2 create
│   │   ├── SnippetDetailPanel.tsx    # US2 edit, US6 versions, US7 comments, US4 tags
│   │   ├── ProfileView.tsx           # US8, US9 (AI settings surfaced here)
│   │   └── LandingPage.tsx (+ components/landing/*)  # US10
│   └── components/
│       ├── CodeEditor.tsx            # CodeMirror wrapper, US2
│       ├── VersionHistoryPanel.tsx   # US6
│       ├── CollectionCard.tsx, CollectionDialog.tsx  # US3
│       ├── TagPill.tsx               # US4
│       ├── LanguageBadge.tsx         # US2 display
│       └── ui/                       # Base UI primitives (Button, Dialog, Input, etc.) used across all stories
```

**Structure Decision**: This matches the repository's existing layout exactly — the plan's purpose is to document *why* this shape is correct for the ten user stories, not to propose a different one. One resource per route file (backend) and one page/hook per major user story (frontend) keeps each user story's implementation independently locatable, which matches spec-kit's "independently testable" requirement for user stories.

## Per-Story Technical Notes

- **US1 (Auth)**: Session persisted server-side via `connect-pg-simple` against the same Postgres instance (`sessionStore` in `index.ts`), not an in-memory store — required so sessions survive a backend restart, which an in-memory `express-session` store would not.
- **US2 (Snippet CRUD)**: `code` has a generous but bounded length validation (`isLength({ max: 65000 })` per existing validators) — a product decision that snippets are code fragments, not full files/repos.
- **US3 (Collections)**: `snippet.collection_id` is nullable at the schema level specifically so US3 can be optional per snippet without a separate "uncategorized" sentinel row.
- **US4 (Tags)**: Global tag table with a many-to-many join (`snippet_tag`) is the correct model since CLAUDE.md confirms tags are intentionally shared across users, not namespaced — a per-user tag table would require a design change, not just a query change.
- **US5 (Search)**: Implemented as filtered queries against the `snippet` table scoped by `userId`, using Drizzle's `ilike`/`and`/`or` — no separate search index (e.g. Postgres full-text search or an external search service) is warranted at this project's scale; revisit only if snippet volume per user grows to a point where `ILIKE` scans become a measured bottleneck.
- **US6 (Versioning)**: Versions are created lazily on `PATCH` only when code actually changes and isn't already saved (`shouldSaveVersion` logic per CLAUDE.md) — avoids a version row per keystroke/autosave and keeps history meaningful rather than noisy.
- **US7 (Comments)**: Simple ownership model — a comment's author, not the snippet's owner, controls edit/delete of that comment. (Note: since all snippets are single-owner and there's no sharing/collaboration model yet, comments are currently always self-authored-on-own-snippet; this only becomes meaningfully different once/if snippet sharing between users is built.)
- **US8 (Profile/account lifecycle)**: Account deletion relies on `onDelete: 'cascade'` FKs already defined in `schema.ts` (collections, snippets, comments, versions, AI settings all reference `users.id` with cascade) rather than application-level cleanup code — correct choice, avoids partial-deletion bugs from forgetting a table.
- **US9 (AI settings)**: Per spec-kit feature `001-owasp-security-hardening`, the API key must be encrypted at rest — this plan defers that concrete fix to feature 001 rather than duplicating it here; US9's scope in this plan is the CRUD/upsert behavior only.
- **US10 (Landing page)**: Pure frontend concern — no backend route involved; React Router's catch-all (`path="*"`) handles unauthenticated/unknown routes.

## Gaps Identified While Planning (flagged, not yet resolved)

- **Public snippet sharing via `share_token`**: `snippet.shareToken` exists in the schema and is mentioned in spec.md's Assumptions as likely in-scope, but no route, page, or user story here actually implements generating/consuming a public share link. This is either dead schema (a removed or not-yet-built feature) or a missing eleventh user story — needs the maintainer's call before being added to tasks.md.
- **No automated tests**: every acceptance scenario in spec.md is manually verified today. Not a defect of this plan, but worth flagging as a standing gap the product carries forward regardless of which feature is being planned.

## Complexity Tracking

*No Constitution Check violations — table intentionally omitted.*
