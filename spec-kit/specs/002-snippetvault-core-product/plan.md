# Implementation Plan: SnippetVault Core Product

**Branch**: `002-snippetvault-core-product` | **Date**: 2026-07-06 (updated 2026-07-07 for US13 sharing + US11 comments formalization; second 2026-07-07 revision for US14–US16 Team Workspaces) | **Spec**: `./spec.md`

**Input**: Feature specification from `spec-kit/specs/002-snippetvault-core-product/spec.md`

## Summary

Build a session-authenticated code snippet manager with dual content scopes: users create/edit/delete snippets, organize them into collections and tags, search across them, retain and restore version history, share individual personal snippets read-only with specific registered users, and additionally create **Team Workspaces** — named membership boundaries (Owner/Admin/Member roles) whose snippets and collections are visible to all members with role-governed write access. Comments are open to a snippet's audience (owner + share recipients for personal snippets; all active members for workspace snippets). Users manage their profile/account lifecycle and optionally configure a personal AI provider integration. An unauthenticated marketing landing page fronts the app. Backend is a REST API over Postgres; frontend is a single-page React app consuming it over session cookies.

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

**Scale/Scope**: Sixteen user stories (spec.md), single Postgres instance, no multi-region considerations. Team Workspaces introduce a light multi-tenant boundary (workspace-scoped rows in shared tables, enforced by per-request membership checks) — deliberately not schema-per-tenant or org-level isolation; flat workspaces, three fixed roles, no billing/quotas/audit

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
├── data-model.md        # Entity/relationship reference incl. the new snippet_share table
├── quickstart.md        # Manual end-to-end validation scenarios for the new sharing/comments scope
├── contracts/
│   ├── sharing-api.md   # REST contract for share management, shared-with-me, and scoped comments
│   └── workspace-api.md # REST contract for workspaces, memberships, scoped content, and moves (US14–US16)
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Run /speckit-tasks next for a granular checklist per user story
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── index.ts                    # App entry: mounts routers under /api, serves frontend build + SPA catch-all
│   ├── db/
│   │   ├── schema.ts                # users, collection, snippet, tag, snippet_tag, snippet_version, comment, user_ai_settings, + snippet_share (US13), + workspace & workspace_membership (US14) + nullable workspace_id on snippet/collection (US15)
│   │   └── index.ts (if present)
│   ├── lib/
│   │   ├── db.ts                    # Drizzle instance + raw pg Pool (Pool also used by connect-pg-simple)
│   │   ├── snippetAccess.ts         # NEW (US11/US13/US16): shared predicates — canAccessSnippet (owner OR share OR active workspace membership) and canEditSnippet (owner/creator OR workspace admin+)
│   │   └── workspaceAccess.ts       # NEW (US14/US16): membership + role lookup helpers (getMembership, requireRole)
│   ├── middleware/
│   │   └── authMiddleware.ts        # reads req.session.userId → sets req.userId
│   ├── routes/
│   │   ├── auth.ts                  # US1
│   │   ├── snippets.ts              # US2, US6 (search + scope selector), US10 (versions live under snippet routes per CLAUDE.md API list); read path widened to recipients (US13) and members (US16); scope-move endpoint (FR-020)
│   │   ├── collections.ts           # US3 + workspace-scoped collections with same-scope assignment rule (US15)
│   │   ├── tags.ts                  # US4 (global registry unchanged; scope-aware filtering handled in snippets listing)
│   │   ├── comments.ts              # US11/US16 — audience check + author identity join
│   │   ├── snippetShares.ts         # NEW (US13): owner-only share CRUD + shared-with-me listing (personal snippets only)
│   │   ├── workspaces.ts            # NEW (US14–US16): workspace CRUD, membership management, transfer, leave, workspace snippet/collection listings
│   │   ├── profile.ts               # US8
│   │   └── aiSettings.ts            # US12
│   └── validators/                  # one file per resource, express-validator chains
│       └── *.ts                     # + snippetShares.ts, workspaces.ts (NEW)
└── drizzle/                          # generated migrations

frontend/
├── src/
│   ├── main.tsx / App.tsx            # router: /login, /register, /dashboard, catch-all → LandingPage (US9)
│   ├── api/                          # one module per resource + types.ts + utils.ts (ApiError, throwIfNotOk)
│   │   ├── shares.ts                 # NEW (US13): share/revoke/list-recipients/shared-with-me calls
│   │   └── workspaces.ts             # NEW (US14–US16): workspace CRUD, membership, workspace content listings, scope moves
│   ├── hooks/
│   │   ├── useSnippets.ts            # US2, US6 (search/filter), US10 (versions)
│   │   ├── useCollections.ts         # US3
│   │   └── useUser.ts                # US1, US8
│   ├── contexts/
│   │   ├── UserContext.tsx           # US1, US8
│   │   └── ToastContext.tsx          # cross-cutting UI feedback
│   ├── pages/
│   │   ├── LogIn.tsx, Register.tsx   # US1
│   │   ├── Dashboard.tsx             # US2 overview
│   │   ├── CollectionsView.tsx       # US3
│   │   ├── SearchView.tsx            # US6
│   │   ├── NewSnippet.tsx            # US2 create
│   │   ├── SharedWithMeView.tsx      # NEW (US13): recipient-side listing
│   │   ├── WorkspaceView.tsx         # NEW (US14/US15): workspace snippet/collection listing + members panel (role-gated management)
│   │   ├── SnippetDetailPanel.tsx    # US2 edit, US10 versions, US11 comments (author identity + read-only recipient mode), US4 tags, US13 share management dialog for owners, US16 role-gated edit affordances + move-scope action
│   │   ├── ProfileView.tsx           # US8, US12 (AI settings surfaced here)
│   │   └── LandingPage.tsx (+ components/landing/*)  # US9
│   └── components/
│       ├── CodeEditor.tsx            # CodeMirror wrapper, US2
│       ├── VersionHistoryPanel.tsx   # US10
│       ├── CollectionCard.tsx, CollectionDialog.tsx  # US3
│       ├── ShareDialog.tsx           # NEW (US13): owner-only recipient list + add/revoke
│       ├── WorkspaceDialog.tsx       # NEW (US14): create workspace, invite member, change role, transfer, delete
│       ├── ScopeSwitcher.tsx         # NEW (US15): personal / workspace / combined context selector in Sidebar
│       ├── TagPill.tsx               # US4
│       ├── LanguageBadge.tsx         # US2 display
│       └── ui/                       # Base UI primitives (Button, Dialog, Input, etc.) used across all stories
```

*(Story annotations above were realigned 2026-07-07 to spec.md's numbering — the original plan drifted: it labeled search US5, versions US6, comments US7, AI settings US9, landing US10. Spec numbering is authoritative: US5 public sharing, US6 search, US7 admin, US9 landing, US10 versions, US11 comments, US12 AI settings, US13 user-to-user sharing.)*

**Structure Decision**: This matches the repository's existing layout exactly — the plan's purpose is to document *why* this shape is correct for the ten user stories, not to propose a different one. One resource per route file (backend) and one page/hook per major user story (frontend) keeps each user story's implementation independently locatable, which matches spec-kit's "independently testable" requirement for user stories.

## Per-Story Technical Notes

- **US1 (Auth)**: Session persisted server-side via `connect-pg-simple` against the same Postgres instance (`sessionStore` in `index.ts`), not an in-memory store — required so sessions survive a backend restart, which an in-memory `express-session` store would not.
- **US2 (Snippet CRUD)**: `code` has a generous but bounded length validation (`isLength({ max: 65000 })` per existing validators) — a product decision that snippets are code fragments, not full files/repos.
- **US3 (Collections)**: `snippet.collection_id` is nullable at the schema level specifically so US3 can be optional per snippet without a separate "uncategorized" sentinel row.
- **US4 (Tags)**: Global tag table with a many-to-many join (`snippet_tag`) is the correct model since CLAUDE.md confirms tags are intentionally shared across users, not namespaced — a per-user tag table would require a design change, not just a query change.
- **US5 (Public sharing)**: `snippet.shareToken` + `visibility` already exist in the schema; the route/page consuming them is the remaining build work. Public-link access is anonymous and read-only, never includes comments, and is entirely separate from US13's authenticated user-to-user shares — the two features share no code path beyond the snippet row itself.
- **US6 (Search)**: Implemented as filtered queries against the `snippet` table scoped by `userId`, using Drizzle's `ilike`/`and`/`or` — no separate search index (e.g. Postgres full-text search or an external search service) is warranted at this project's scale; revisit only if snippet volume per user grows to a point where `ILIKE` scans become a measured bottleneck.
- **US10 (Versioning)**: Versions are created lazily on `PATCH` only when code actually changes and isn't already saved (`shouldSaveVersion` logic per CLAUDE.md) — avoids a version row per keystroke/autosave and keeps history meaningful rather than noisy.
- **US11 (Comments)**: A comment's author, not the snippet's owner, controls edit/delete of that comment. With US13 in scope, comment visibility/creation widens from owner-only to owner-plus-recipients via the shared `canAccessSnippet` predicate (`lib/snippetAccess.ts`) — one Drizzle helper meaning "owner OR active `snippet_share` row", used by comments GET/POST and the snippet single-read path so the access rule can't drift between routes. This also closes the recorded FR-012 defect: today comments GET/POST perform no snippet-access check at all. Comment list responses join `users` for `username`/`display_name` (single joined query, no N+1) so authorship renders once commenters aren't always the owner.
- **US8 (Profile/account lifecycle)**: Account deletion relies on `onDelete: 'cascade'` FKs already defined in `schema.ts` (collections, snippets, comments, versions, AI settings — and now shares and workspace memberships — all reachable from `users.id` with cascade; deleting the account of a Workspace Owner requires transfer or workspace deletion first, enforced at the route level like owner-leave) rather than application-level cleanup code — correct choice, avoids partial-deletion bugs from forgetting a table.
- **US12 (AI settings)**: Per spec-kit feature `001-owasp-security-hardening`, the API key must be encrypted at rest — this plan defers that concrete fix to feature 001 rather than duplicating it here; US12's scope in this plan is the CRUD/upsert behavior only.
- **US9 (Landing page)**: Pure frontend concern — no backend route involved; React Router's catch-all (`path="*"`) handles unauthenticated/unknown routes.
- **US13 (User-to-user sharing)**: New `snippet_share` table (see `data-model.md`): `snippet_id` FK cascade, `user_id` (recipient) FK cascade, `permission` varchar defaulting to `'view'` (future-proofing only — no second level implemented), `created_at`, unique on (`snippet_id`, `user_id`), indexes on both FKs per the CLAUDE.md FK-index rule. Share management routes are owner-only (ownership verified in the `WHERE` clause, per FR-012); the share POST resolves the recipient by email or username and is idempotent via `onConflictDoNothing` on the unique pair. Recipient lookup failure returns the same 404 shape as other share-validation failures to limit account enumeration beyond what sharing inherently requires. Recipients get read access through `canAccessSnippet` on `GET /api/snippets/:id` only — every mutation path (PATCH/DELETE snippet, tags, collection reassignment, share management, versions restore/delete) stays owner-scoped. "Shared with me" is a dedicated listing endpoint joining `snippet_share` → `snippet` for `req.userId`. Wire format follows the snake_case `mapShare` convention like every other route. **Workspace interaction (2026-07-07 rev 2)**: shares apply to personal snippets only — the share POST rejects workspace-scoped snippets, and moving a snippet into a workspace (FR-020) deletes its share rows in the same transaction.
- **US14 (Workspaces & membership)**: Two new tables, `workspace` and `workspace_membership` (see `data-model.md` for DDL): membership is unique per (`workspace_id`, `user_id`) with a `role` in (`owner`, `admin`, `member`) — the Owner is a membership row like any other, with the exactly-one-Owner invariant enforced at the route level inside transactions (create sets creator as owner; transfer demotes-then-promotes atomically; owner leave/removal rejected). `lib/workspaceAccess.ts` provides `getMembership(workspaceId, userId)` and a `requireRole` guard used by every workspace route — per-request lookups against current membership, no caching, which is what makes mid-session removal take effect on the next request under session auth. Invite resolution reuses US13's email-or-username pattern and its unified 404 anti-enumeration shape. Slug is generated from the name (unique, URL-safe) — spec requires uniqueness, not user-chosen vanity slugs.
- **US15 (Workspace content)**: Additive nullable `workspace_id` FK (cascade) on both `snippet` and `collection` — `NULL` means personal, set means workspace-scoped; no data backfill needed since all existing rows are personal by definition. The same-scope rule (workspace snippet ↔ same-workspace collection; personal ↔ personal-owned) is validated in the collection-assignment path of `PATCH /api/snippets/:id`, extending the existing collection-ownership check rather than adding a parallel one. Workspace collection deletion keeps the existing `onDelete: 'set null'` behavior on `snippet.collection_id` — uncategorize, not delete, exactly as personal collections already behave. Tags stay global; scope-aware tag filtering is a `WHERE` addition on the listing/search query, not a tag-model change. Listing/search gains a scope selector (personal | workspace:id | combined) that composes with the existing filters; every workspace-scoped query verifies membership first.
- **US16 (Role enforcement & comments)**: `canAccessSnippet` (from US13) widens to: owner OR active share (personal) OR active membership in the snippet's workspace — still one predicate, one place. A second predicate `canEditSnippet` covers writes: personal → owner only; workspace → creator, or membership role in (`admin`, `owner`). Comments routes call `canAccessSnippet` unchanged — workspace comment access falls out of the predicate for free, which is exactly why the predicate was centralized in US11/US13's design. Comment edit/delete stays author-only. Platform admin (US7) gets no bypass in either predicate — workspace access derives from membership rows exclusively, per FR-018.

## Gaps Identified While Planning (updated 2026-07-07)

- **Public snippet sharing via `share_token`** *(resolved)*: previously flagged as dead schema or a missing user story — now resolved by the spec update: US5 formalizes the public share link (anonymous, read-only, no comments), and US13 adds the separate authenticated user-to-user sharing model. `snippet.shareToken` is live schema serving US5.
- **No automated tests**: every acceptance scenario in spec.md is manually verified today (see `quickstart.md` for the manual validation script covering the new sharing/comments scope). Not a defect of this plan, but worth flagging as a standing gap the product carries forward regardless of which feature is being planned.

## Complexity Tracking

*No Constitution Check violations — table intentionally omitted.*
