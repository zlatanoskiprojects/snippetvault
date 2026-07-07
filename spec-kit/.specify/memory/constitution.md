# SnippetVault Constitution

## Core Principles

### I. Ownership Enforcement (NON-NEGOTIABLE)

Every route handler that reads, writes, or deletes a user-owned resource (snippet, collection, comment, snippet version, AI settings) MUST filter by `req.userId` in its query — never trust a `:id` route param alone as sufficient authorization. When a mutation reassigns a foreign key owned by a different table (e.g. setting `collection_id` on a snippet), the handler MUST verify that referenced row also belongs to `req.userId` before writing. This applies regardless of a resource's visibility setting. No feature spec, plan, or task may weaken or bypass this to simplify implementation.

### II. Snake_case/CamelCase API Boundary

Drizzle schema columns and TypeScript variables are camelCase; every wire-format API response is snake_case. Every route MUST translate between the two at the route boundary via a local `mapX`/`mapXWithY` function — never by changing the schema's casing, never by leaking camelCase into a JSON response. This convention is load-bearing for the frontend's `api/` modules and MUST be followed by any new endpoint.

### III. Session-Based Authentication Only

Authentication state lives in a server-side session (`express-session` + `connect-pg-simple`), identified by a `connect.sid` cookie. No feature may introduce JWTs, localStorage-based auth tokens, or client-held credentials as a replacement or parallel mechanism. Passwords are hashed via `bcryptjs` before storage and are never logged, returned in a response, or compared in plaintext.

### IV. OWASP/ASVS Security Baseline

All new and modified code MUST follow the OWASP Top 10 / ASVS practices already codified in this project: parameterized queries only (no raw SQL string interpolation of user input), `express-validator` chains on every mutation route checked via `validationResult` before touching the database, no secrets or credentials committed to source control, encrypted-at-rest storage for any third-party credential a user provides (e.g. `user_ai_settings.api_key_enc`), an explicit CORS allowlist (never a wildcard or reflected origin), and React's default JSX escaping relied upon over `dangerouslySetInnerHTML` for any user-controlled content. A feature plan MUST call out any deviation explicitly rather than silently omitting a control.

### V. Simplicity and No Speculative Abstraction

Prefer the simplest implementation that satisfies the current spec's acceptance scenarios. Do not add configuration, abstraction layers, feature flags, or generalized frameworks for requirements that are not in an approved spec. A bug fix does not need surrounding refactors; a one-off script does not need a reusable module. Three similar lines beat a premature abstraction. This project has no automated test suite today — that is an accepted, deliberate state, not a gap every feature must silently work around; features MUST document their manual verification steps (per spec.md's Independent Test / Acceptance Scenarios) rather than skip verification entirely.

## Technology Stack Requirements

- **Backend**: Express + TypeScript, PostgreSQL accessed exclusively through Drizzle ORM (`drizzle-orm/node-postgres`) — no raw `pg`/`mysql2` query strings in route handlers outside parameterized `sql\`...\`` fragments used for cases the query builder cannot express.
- **Frontend**: React + TypeScript + Vite, Tailwind CSS v4 only (no CSS modules, no inline styles, no other CSS framework). Interactive primitives (buttons, dialogs, inputs, selects, etc.) MUST be built on `@base-ui/react` + `class-variance-authority`, composed via `cn()` (`clsx` + `tailwind-merge`) in `src/components/ui/` — new one-off inline primitives are not permitted where an equivalent `ui/` component exists.
- **Code style**: No comments in generated code — no inline comments, no block comments, no docstrings — across both backend and frontend.
- **Build artifacts**: Compiled output (`backend/build/`, `*.tsbuildinfo`) is never committed to version control; only source and configuration are tracked.

## Governance

This constitution supersedes ad hoc practice where the two conflict. CLAUDE.md remains the detailed operational reference (exact file paths, API route list, current architecture specifics); this constitution is the smaller, stable set of principles that CLAUDE.md's details exist to serve — CLAUDE.md may be amended freely as the codebase evolves, but a change that would violate a principle here requires amending this constitution first, explicitly, with a version bump and a stated reason. Every `/speckit-plan` MUST include a Constitution Check section confirming compliance with all five principles above, or explicitly justifying and documenting any deviation in that plan's Complexity Tracking table.

**Version**: 1.1.0 | **Ratified**: 2026-07-06 | **Last Amended**: 2026-07-07
