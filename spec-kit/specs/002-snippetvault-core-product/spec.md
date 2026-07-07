# Feature Specification: SnippetVault Core Product

**Feature Branch**: `002-snippetvault-core-product`

**Created**: 2026-07-06

**Status**: Draft

**Input**: Product problem statement and formal functional/non-functional requirements provided by the project owner, reconciled against the existing implementation (`backend/src/routes/`, `frontend/src/pages/`, `CLAUDE.md`) and the ratified project constitution.

## Problem Statement

Anyone who spends enough time in a terminal ends up building a small personal toolkit without really meaning to — a bash script that automates a repetitive task, a fix for a stubborn configuration issue, a sequence of commands that finally got a package installed correctly. These things take real time to figure out, and most developers have no real system for keeping any of it. The script ends up somewhere in a home directory, the command gets half-remembered next time it's needed, and a fix that took two hours to track down gets lost entirely after an OS reinstall.

This pattern gets worse moving from working alone to working with others. A teammate may have already solved the exact problem someone else is stuck on, but there's no shared place for that kind of low-level institutional knowledge — it lives in someone's head or personal files and disappears when they move on. For organizations handling sensitive code, the problem is more serious still: the tools developers reach for to store and share snippets (Gists, Pastebin) put that code on servers the organization doesn't control.

SnippetVault exists to address this directly: a system to create, organize, tag, and share code snippets with proper visibility controls — covering the productivity, collaboration, and data-ownership problems in one place.

## Target Users & Deployment Model

- **Individual developers**: personal snippet vault replacing scattered text files, half-remembered commands, and notes buried in unrelated projects.
- **Development teams**: shared discovery of solutions teammates have already found, without relying on institutional memory.
- **Organizations with sensitive code**: need snippet storage and sharing they fully control, not a third-party-hosted Gist/Pastebin equivalent.

Two deployment targets are in scope: a **cloud (SaaS) version** for individuals and small teams, and a **self-hosted version** for organizations that require full control over where their code lives. Both share the same application; deployment mode affects operational requirements (backups, uptime, data residency — see Non-Functional Requirements) more than application behavior. **This spec does not yet resolve the architectural implications of dual deployment modes** (e.g. whether self-hosted needs a different backup/health-check surface than the current single Express+Postgres process supports) — flagged as an open item for `plan.md`, not resolved here.

## Scope Reconciliation (read before implementing)

The project owner's formal functional requirements (below) were cross-checked against what's already built. Three capabilities exist in the current codebase but are **not mentioned in the formal requirements**: **version history/restore**, **comments on snippets**, and **per-user AI provider settings**. They are kept in this spec as lower-priority user stories (US10–US12) rather than deleted, since removing working, non-harmful functionality without being asked to would be a worse default than flagging the discrepancy. Treat US10–US12 as "already delivered, formally out-of-spec" rather than "must build" — they need a product decision (keep, formalize, or deprecate), not implementation work.

One requirements-vs-code conflict was found and has been resolved: the formal non-functional requirements call for **JWT-based API authentication**, but the existing implementation and the ratified project constitution (Principle III) use **server-side sessions**. Per project owner decision, **session-based authentication is authoritative** — the JWT line in the original requirements document is superseded by this spec and should not be implemented.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account registration, authentication, and roles (Priority: P1)

A new user registers with a username, email, and password, and is assigned the regular-user role by default. A returning user logs in and stays authenticated via a server-side session; either can log out. Every account has a role — regular user or administrator — governing what they can access (see User Story 7).

**Why this priority**: Nothing else in the product is reachable without an account.

**Independent Test**: Register a new account, confirm it defaults to the regular-user role, log out, log back in, confirm a protected route is reachable only while authenticated.

**Acceptance Scenarios**:

1. **Given** an unused email and username, **When** a user submits registration, **Then** an account is created with the regular-user role by default, the password is stored hashed (bcrypt, never plaintext), and the registration timestamp is recorded.
2. **Given** valid credentials, **When** a user logs in, **Then** a server-side session is established and persists across requests via a cookie — no JWT or client-stored token is issued.
3. **Given** invalid credentials, **When** login is attempted, **Then** the request is rejected without revealing whether the email or password was the specific mismatch.
4. **Given** an authenticated session, **When** the user logs out, **Then** the session is invalidated and protected routes become unreachable.
5. **Given** an unauthenticated request to any protected route, **When** made, **Then** it is rejected (401).

---

### User Story 2 - Create, edit, and delete snippets (Priority: P1)

A user writes a code snippet with a title, code content, a programming language selected from a predefined list, an optional description, and a visibility setting (public/private), then can edit or delete it later. Creation and last-modification timestamps are tracked automatically.

**Why this priority**: The core unit of value in the product — every other capability organizes, annotates, or shares a snippet, so snippets must exist first.

**Independent Test**: Create a snippet, confirm it appears in the user's list with a creation timestamp, edit its code, confirm the last-modified timestamp updates, delete it, confirm it's gone.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they submit title, code, and a language from the predefined list (e.g. JavaScript, Python, Java, C++, SQL, Go, Rust, TypeScript), **Then** the snippet is saved with automatic creation and last-modified timestamps.
2. **Given** a language value not on the predefined list, **When** submitted, **Then** the request is rejected with a validation error rather than silently accepted as free text.
3. **Given** an existing snippet the user owns, **When** they edit any field, **Then** the change persists and the last-modified timestamp updates.
4. **Given** an existing snippet, **When** the user deletes it, **Then** it is removed without affecting other users' data.
5. **Given** a snippet owned by a different user, **When** the current user attempts to view, edit, or delete it directly by ID, **Then** the request is rejected regardless of that snippet's visibility setting — visibility governs the public share link (User Story 5), not direct ID-based API access by non-owners.
6. **Given** a snippet's `code` field exceeding the maximum allowed length, **When** submitted, **Then** it is rejected with a validation error before reaching the database.

---

### User Story 3 - Organize snippets into collections (Priority: P2)

A user creates named collections (name, optional description, creation timestamp) to group related snippets, moves snippets between collections, or leaves a snippet uncategorized. Deleting a collection does not delete its snippets.

**Why this priority**: Valuable organization once a user has more than a handful of snippets; the product functions without it since collection assignment is optional.

**Independent Test**: Create a collection, assign a snippet to it, reassign the snippet elsewhere or to none, confirm the snippet still exists standalone; delete the collection, confirm its former snippets survive uncategorized.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they create a collection with a name, **Then** it is saved under their account with a creation timestamp; description is optional.
2. **Given** an existing collection they own, **When** a user assigns a snippet to it, **Then** the assignment succeeds only if both the snippet and the collection belong to the same user; a snippet belongs to at most one collection at a time.
3. **Given** a collection is deleted, **When** the deletion completes, **Then** its former snippets become uncategorized, not deleted.
4. **Given** a collection owned by another user, **When** the current user attempts to assign their own snippet to it, **Then** the request is rejected.
5. **Given** an existing collection, **When** the owner renames it or edits its description, **Then** the change persists.

---

### User Story 4 - Tag snippets for cross-cutting organization (Priority: P2)

A user attaches one or more short text tags (e.g. "api", "utility", "database", "sorting") to a snippet, selecting from a global tag registry or creating a new tag, independent of collection membership.

**Why this priority**: A second, complementary organizational axis to collections — useful but not required for the core loop.

**Independent Test**: Create a new tag by attaching it to a snippet, confirm a second snippet can reuse the same tag by selecting it (not recreating it), confirm filtering by that tag returns both.

**Acceptance Scenarios**:

1. **Given** a tag name that doesn't yet exist, **When** a user attaches it to a snippet, **Then** the tag is created in the global registry (not per-user) and linked to that snippet.
2. **Given** a tag that already exists (created by any user), **When** a different user attaches it to their own snippet, **Then** the existing global tag is reused, not duplicated.
3. **Given** a tag attached to a snippet, **When** the user removes it, **Then** only that association is deleted; the global tag persists if other snippets still use it.

---

### User Story 5 - Public sharing via unique links (Priority: P2)

When a user sets a snippet's visibility to public, the system generates a unique, URL-safe share token forming a shareable link. Anyone with that link can view the snippet's title, description, code, language, and tags without authenticating. The owner can revoke access at any time by setting the snippet back to private, invalidating the link.

**Why this priority**: Directly serves the product's core differentiation — controlled sharing without handing code to a third-party-hosted Gist/Pastebin equivalent — but is additive to core CRUD (User Story 2), not required for the product to be individually useful.

**Independent Test**: Set a snippet to public, retrieve its share link, load that link in an unauthenticated session and confirm the snippet's content renders; set it back to private, confirm the same link now fails to resolve.

**Acceptance Scenarios**:

1. **Given** a private snippet, **When** its owner sets visibility to public, **Then** a unique share token is generated (if one doesn't already exist) and a shareable link becomes valid.
2. **Given** a valid share link for a public snippet, **When** accessed without authentication, **Then** the snippet's title, description, code, language, and tags are viewable, but not owner-only data (e.g. no edit/delete affordance, no comments if those are private to the owner).
3. **Given** a public snippet, **When** the owner sets it back to private, **Then** the previously valid share link no longer resolves to the snippet's content.
4. **Given** a share link for a snippet that was deleted entirely, **When** accessed, **Then** it fails cleanly (404-equivalent), not with an unhandled error.
5. **Given** two different public snippets, **When** their share tokens are generated, **Then** they are guaranteed unique — no collision allows one snippet's link to expose another's content.

---

### User Story 6 - Search and filtering (Priority: P2)

A user searches their own snippets by title, description, code content, tags, or language, sorts results by creation date, last-modified date, or title, and combines multiple filters (language, tags, visibility) in a single query.

**Why this priority**: Necessary once a user's snippet count grows past what browsing alone handles — a usability requirement layered on top of core CRUD.

**Independent Test**: Create several snippets with distinct titles/languages/tags, search by a keyword unique to one, confirm only that snippet returns; add a language filter and a tag filter simultaneously and confirm results satisfy all conditions; sort by title and confirm order changes accordingly.

**Acceptance Scenarios**:

1. **Given** a search term, **When** submitted, **Then** only the requesting user's own snippets are searched, regardless of visibility — this endpoint is not the public share-link path from User Story 5.
2. **Given** a search term matching no snippets, **When** submitted, **Then** an empty result set is returned, not an error.
3. **Given** a search combined with language and/or tag filters, **When** submitted, **Then** results satisfy all conditions together (AND, not OR).
4. **Given** a sort parameter (creation date, last-modified date, or title), **When** provided, **Then** results are ordered accordingly; when omitted, a documented default order applies.

---

### User Story 7 - Administrator role and platform management (Priority: P3)

An administrator (a distinct role from regular user) can view, deactivate, or delete any user account, moderate public snippets, and access platform-wide statistics (total users, total snippets, most-used languages). Regular users cannot access any of this.

**Why this priority**: Necessary for operating the product safely as it grows beyond a single self-managed user, but not required for an individual or small team's day-to-day use — the product functions for its primary user base without it being built first.

**Independent Test**: As an administrator, view the platform stats dashboard and a list of all users; deactivate a test user's account and confirm they can no longer log in; as that same test user (before deactivation) or as a regular user, confirm none of these admin views or actions are reachable.

**Acceptance Scenarios**:

1. **Given** an authenticated administrator, **When** they request the user list, **Then** they see all registered users, not only their own account.
2. **Given** an authenticated administrator, **When** they deactivate or delete another user's account, **Then** that account can no longer authenticate (deactivate) or is fully removed with cascading data cleanup (delete).
3. **Given** an authenticated administrator, **When** they request platform statistics, **Then** they receive total user count, total snippet count, and a breakdown of most-used languages.
4. **Given** an authenticated administrator, **When** they moderate (e.g. force-hide or remove) a public snippet, **Then** that snippet's public share link stops resolving.
5. **Given** an authenticated regular user, **When** they attempt any of the above (user list, deactivation, platform stats, moderation), **Then** the request is rejected regardless of how it's invoked (route-level authorization, not just UI hiding).

---

### User Story 8 - Profile and account lifecycle management (Priority: P3)

A user views and edits their profile (display name, bio, avatar), changes their password, and can delete their account entirely, removing all owned data.

**Why this priority**: Account hygiene — necessary for a complete product but not part of the daily snippet-management loop.

**Independent Test**: Update display name and bio, confirm persistence; change password, log out, log back in with the new password; delete the account, confirm old credentials no longer authenticate and owned data is gone.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they update display name, bio, or avatar, **Then** the change persists without requiring re-authentication.
2. **Given** a password-change request with the correct current password and a new one, **When** submitted, **Then** the password is updated (re-hashed via bcrypt).
3. **Given** an account-deletion request, **When** confirmed, **Then** the account and all owned snippets, collections, and (if applicable) comments/versions/AI settings are removed, and the session is terminated.

---

### User Story 9 - Landing page and dashboard (Priority: P4)

An unauthenticated visitor sees a public landing page presenting the product's features, benefits, and a registration call-to-action. After authenticating, a user lands on a personal dashboard summarizing their snippets, recent activity, and collection count, with quick access to create or browse snippets.

**Why this priority**: Supports acquisition and day-one orientation but has no bearing on the product's core function for an existing, oriented user.

**Independent Test**: Visit while logged out, confirm the landing page (not a protected view or error) renders with a working call-to-action into registration; log in, confirm the dashboard shows a snippet/collection summary rather than an empty or generic screen.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they load the app's root or any unmatched path, **Then** the landing page renders.
2. **Given** the landing page, **When** the visitor clicks the primary call-to-action, **Then** they're taken to registration (or login).
3. **Given** an authenticated user, **When** they land on the dashboard, **Then** it shows a summary of their snippets, recent activity, and collection count, with a path to create a new snippet or browse existing ones.

---

### User Story 10 - Version history and restore *(built, not in formal requirements — see Scope Reconciliation)* (Priority: P3)

Every meaningful code edit to a snippet preserves a prior version, viewable in a history panel and restorable.

**Why this priority**: Already implemented; kept as a real product capability (protects against accidental overwrites) pending a decision on whether to formalize it into the official requirements.

**Independent Test**: Edit a snippet's code three times with distinct content, confirm three versions are listed, restore an earlier one, confirm current code matches it and the pre-restore code was itself preserved as a new version.

**Acceptance Scenarios**:

1. **Given** a code edit that differs from the current code and every saved version, **When** it's saved, **Then** a new version is created capturing the prior code.
2. **Given** an edit identical to the current code, **When** saved, **Then** no redundant version is created.
3. **Given** a restore of an older version, **When** completed, **Then** the snippet's current code becomes that version's code, and the pre-restore code is itself saved as a new version first if it would otherwise be lost.

---

### User Story 11 - Comments on snippets *(built, not in formal requirements — see Scope Reconciliation)* (Priority: P3)

A user leaves comments on their own snippets as personal notes/context, editable and deletable by their author.

**Why this priority**: Already implemented; lowest usage-frequency organizational feature, pending a decision on formalizing.

**Independent Test**: Add, edit, and delete a comment on an owned snippet; confirm cascading deletion when the snippet itself is deleted.

**Acceptance Scenarios**:

1. **Given** an authenticated user viewing their own snippet, **When** they post a comment, **Then** it's saved associated with the snippet and the author.
2. **Given** a comment a user authored, **When** they edit or delete it, **Then** it succeeds only for their own comment.
3. **Given** a snippet is deleted, **When** completed, **Then** its comments are removed too.

---

### User Story 12 - Personal AI provider settings *(built, not in formal requirements — see Scope Reconciliation)* (Priority: P4)

A user configures a personal AI provider integration (type, API key, model, base URL) for potential future AI-assisted features.

**Why this priority**: No consuming feature currently uses this configuration (confirmed: no code path calls out to an AI provider) — lowest priority, delivers no end-user value until something is built on top of it, and isn't part of the formal requirements at all.

**Independent Test**: Save AI settings, confirm `GET` never returns the raw API key, update non-key fields and confirm the key remains configured.

**Acceptance Scenarios**:

1. **Given** no existing AI settings, **When** a user submits provider config including an API key, **Then** a settings row is created for that account only, key encrypted at rest.
2. **Given** existing settings, **When** resubmitted, **Then** it upserts rather than duplicating (one row per user).
3. **Given** any `GET` of AI settings, **When** returned, **Then** the raw API key is never included.

### Edge Cases

- What happens when a user's session cookie is valid but the underlying user row has been deleted (e.g. an administrator deleted the account, or deleted it from another device mid-session)? Every protected route must handle a missing user gracefully, not throw an unhandled error.
- What happens when two tabs edit the same snippet concurrently? Last-write-wins is the current implicit behavior — acceptable for a single-owner-per-snippet model; revisit only if real multi-editor collaboration is ever added.
- What happens when a public snippet's share link is requested at a rate suggesting scraping/abuse? Not addressed by any current requirement — flagged as an open question, not assumed out of scope.
- What happens when an administrator deactivates their own account, or the last remaining administrator account? Needs an explicit rule (e.g. disallow, or require at least one active administrator) rather than being left to whatever the deactivation code happens to do.
- What happens when a collection is deleted while a snippet inside it is being edited in another tab? The snippet's collection reference becomes null; the editing client should not silently keep referencing a deleted collection.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support registration, login, logout, and server-side session persistence (no JWT/localStorage-based auth state) — session-based auth is authoritative per the Scope Reconciliation's resolution of the JWT-vs-session conflict.
- **FR-002**: System MUST hash passwords via bcrypt before storage and never return a password hash in any API response.
- **FR-003**: System MUST assign every user a role (regular user or administrator, defaulting to regular user) and enforce role-based access at the route level, not only in the UI.
- **FR-004**: System MUST allow full CRUD on snippets (title, code, language restricted to a predefined allowlist, description, visibility), scoped to the owning user for every read/write, with automatic creation and last-modified timestamps.
- **FR-005**: System MUST support nullable collection assignment on a snippet (one collection at a time), with reassignment validated against collection ownership; deleting a collection must not delete its snippets.
- **FR-006**: System MUST support a global tag registry, attachable to/detachable from snippets, reusing existing tag rows rather than duplicating by name.
- **FR-007**: System MUST generate a unique, URL-safe share token when a snippet's visibility becomes public, serve that snippet's public fields to unauthenticated requests via the token, and invalidate access when visibility reverts to private.
- **FR-008**: System MUST support searching a user's own snippets by title/description/code/tags/language, combinable with filters (AND semantics) and sortable by creation date, last-modified date, or title.
- **FR-009**: System MUST restrict administrator-only actions (user list/deactivation/deletion, platform statistics, public-snippet moderation) to the administrator role at the route level.
- **FR-010**: System MUST support profile viewing/editing, password change (requiring current password), and full account deletion cascading to all owned data.
- **FR-011**: System MUST render a public landing page for unauthenticated visitors on any unmatched route, and an authenticated dashboard summarizing snippets/activity/collections after login.
- **FR-012**: System MUST reject any request to view, modify, or delete another user's owned resource via direct ID access regardless of that resource's visibility setting — visibility only governs the public share-link path (FR-007), never direct API access by a non-owning, non-administrator user.
- **FR-013** *(existing, not in formal requirements)*: System MAY continue to support snippet version history/restore and snippet comments and per-user AI provider settings as already implemented, pending an explicit product decision to formalize, change, or deprecate each.

### Key Entities

- **User**: account identity (username, email, password hash, role [regular/administrator], display name, bio, avatar, registration timestamp).
- **Snippet**: core content unit (title, code, language [predefined allowlist], description, visibility [public/private], share token, optional collection, owner, created/last-modified timestamps).
- **Collection**: named grouping of snippets (name, optional description, creation timestamp), owned by a user.
- **Tag**: global label, many-to-many with snippets.
- **SnippetVersion** *(existing, not in formal requirements)*: immutable historical snapshot of a snippet's code.
- **Comment** *(existing, not in formal requirements)*: user-authored annotation on a snippet.
- **UserAiSettings** *(existing, not in formal requirements)*: one-per-user external AI provider configuration.

## Non-Functional Requirements *(mandatory)*

- **NFR-001 (Performance/Scale)**: The system must handle up to 5,000 concurrent users with an average API response time under 500ms for standard operations (listing, searching, loading a snippet).
- **NFR-002 (Search performance)**: Search across a user's snippet library of up to 50,000 records must return within 1 second.
- **NFR-003 (Syntax highlighting)**: The system must integrate an external syntax-highlighting library to render code snippets with language-specific formatting in the browser (already satisfied by the existing CodeMirror integration for the languages it currently supports — extending highlighting to the full predefined language allowlist from FR-004 is in scope).
- **NFR-004 (Security/transport)**: All data exchange must be encrypted via HTTPS/TLS. Passwords stored via bcrypt (already satisfied). Authentication is session-based per the Scope Reconciliation, not JWT as originally drafted.
- **NFR-005 (Data retention & backup)**: User data and snippet content must be retained for a minimum of 36 months. The self-hosted deployment must support automated daily database backups with configurable retention. The SaaS deployment must maintain data across at least two geographically separated data carriers.
- **NFR-006 (No redundant data entry)**: The system must avoid redundant manual entry — automatic timestamps (already satisfied), and tag reuse from the global registry rather than forcing re-creation (already satisfied by FR-006).
- **NFR-007 (Accessibility/reach)**: The SaaS version must be usable from any location via a modern desktop or mobile browser.
- **NFR-008 (Availability)**: The SaaS deployment must target 99.5% uptime; the self-hosted deployment must expose health-check endpoints for external monitoring.
- **NFR-009 (Documentation)**: Installation and integration documentation must be provided for the self-hosted deployment path.
- **NFR-010 (Delivery constraints)**: Development is targeted for completion within three months of design finalization, within an estimated budget of €5000 — a project-management constraint, not a system behavior, tracked here for completeness rather than encoded into any acceptance scenario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can go from registration to having their first saved snippet in under 2 minutes of interaction.
- **SC-002**: No API response, under any endpoint, ever includes another user's private data, any user's password hash, or a raw (unencrypted) AI API key.
- **SC-003**: A user with 100+ snippets can locate a specific one via search in under 5 seconds of interaction.
- **SC-004**: A public snippet's share link renders correctly to an unauthenticated visitor, and stops resolving within one request cycle after the owner reverts it to private.
- **SC-005**: Deleting an account leaves zero orphaned rows tied to that user across every owned resource type (verified via cascade FK behavior).
- **SC-006**: Standard read operations (list, search, single-snippet view) complete within 500ms under normal load, per NFR-001.

## Assumptions

- Single-tenant-per-account model beyond the new administrator role: there is no team/organization/shared-workspace concept in this spec — "development teams" in the Target Users section benefit from shared *discovery* via public sharing (User Story 5) and tag conventions, not from a built shared-workspace feature. If true team workspaces are wanted, that's a materially larger addition than this spec covers and should be its own future feature.
- The predefined language allowlist (FR-004) starts from the list given in the formal requirements (JavaScript, Python, Java, C++, SQL, Go, Rust, TypeScript) and can grow, but is a closed list enforced server-side, not open free text — this resolves the earlier open question about whether `snippet.language` should be an enum: yes, per the formal requirements' explicit "predefined list" language.
- Tags remain global (not per-user), an intentional decision already reflected in the schema and unchanged by the formal requirements, which describe "a global tag registry" consistent with the existing design.
- Deployment-mode-specific requirements (NFR-005, NFR-008 self-hosted vs. SaaS distinctions) are captured here as requirements to plan for, not yet resolved into a concrete architecture — that resolution belongs in `plan.md`.
- No automated test suite exists yet; acceptance scenarios above are the manual verification contract until test tooling is introduced as its own effort.
