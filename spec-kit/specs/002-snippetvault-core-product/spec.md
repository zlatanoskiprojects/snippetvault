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

The project owner's formal functional requirements (below) were cross-checked against what's already built. Three capabilities exist in the current codebase but are **not mentioned in the formal requirements**: **version history/restore**, **comments on snippets**, and **per-user AI provider settings**. They are kept in this spec as lower-priority user stories (US10–US12) rather than deleted, since removing working, non-harmful functionality without being asked to would be a worse default than flagging the discrepancy. Treat US10 and US12 as "already delivered, formally out-of-spec" rather than "must build" — they need a product decision (keep, formalize, or deprecate), not implementation work.

**Update (2026-07-07, second revision, project owner decision)**: **Team Workspaces (US14–US16)** are added, reversing this spec's earlier assumption that shared workspaces were out of scope. A workspace is a named environment with its own membership and roles (Workspace Owner / Workspace Admin / Workspace Member); snippets and collections gain a dual scope — personal (as before) or workspace-owned. Personal-scope behavior, including US13 user-to-user sharing, is unchanged and continues to apply **to personal snippets only**; workspace snippets are governed by workspace roles instead. The requested requirement identifiers FR-014–FR-018 for this layer were already partially allocated (FR-014/FR-015 cover US13/US11), so the workspace layer occupies **FR-016–FR-020**. Storage-level definitions live in `data-model.md`, not this spec.

**Update (2026-07-07, project owner decision)**: Comments (US11) are now **formalized into scope** rather than pending a decision, and a new capability — **user-to-user snippet sharing (US13)** — is added. A snippet owner can share a snippet with specific registered users, who gain read-only access and may participate in that snippet's comments. This is distinct from and orthogonal to public share-link visibility (US5): public links remain anonymous, read-only, and comment-free. A **known defect** is also recorded: the current comment listing and creation endpoints do not verify that the requester has any access to the target snippet at all, violating FR-012 — any authenticated user can read or post comments on any snippet by guessing its ID. Fixing this is part of US11/US13's acceptance, not optional hardening.

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
2. **Given** a valid share link for a public snippet, **When** accessed without authentication, **Then** the snippet's title, description, code, language, and tags are viewable, but not access-restricted data (no edit/delete affordance, no comments — comments are visible only to the owner and share recipients per User Story 11, never on the public link).
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

### User Story 11 - Comments on snippets, scoped to owner and share recipients *(formalized 2026-07-07 — see Scope Reconciliation)* (Priority: P3)

The snippet owner and every user the snippet has been shared with (see User Story 13) can view and post comments on that snippet, as notes, context, or discussion. Each comment displays its author's identity (username/display name). A comment is editable and deletable only by its author. No one else — including other authenticated users who guess the snippet's ID — can see or post comments on it. Anonymous visitors on a public share link (User Story 5) never see comments.

**Why this priority**: Comment CRUD is already implemented; this story adds the access rule (owner + share recipients), author identity display, and the fix for the recorded access-control defect.

**Independent Test**: As the owner, comment on an owned snippet; share the snippet with a second user, confirm that user can read the owner's comment (with author identity shown) and post their own; as a third user with no share, confirm both reading and posting comments on that snippet are rejected; confirm each author can edit/delete only their own comment; delete the snippet and confirm its comments are gone.

**Acceptance Scenarios**:

1. **Given** the snippet owner or a user the snippet is shared with, **When** they post a comment, **Then** it's saved associated with the snippet and the author, and appears to every user with access to that snippet.
2. **Given** a comment list is requested by a user with access, **When** returned, **Then** each comment includes its author's identity (username/display name), not just an opaque author ID.
3. **Given** an authenticated user with no ownership of and no share to a snippet, **When** they attempt to list or post comments on it by ID, **Then** the request is rejected — this closes the recorded defect where these endpoints performed no snippet-access check (FR-012 violation).
4. **Given** a comment a user authored, **When** they edit or delete it, **Then** it succeeds only for their own comment — the snippet owner cannot edit another author's comment text (deletion moderation by the owner is not in scope).
5. **Given** a snippet is deleted, **When** completed, **Then** its comments are removed too.
6. **Given** a share is revoked (User Story 13), **When** the former recipient attempts to list or post comments on that snippet, **Then** the request is rejected; comments they authored while the share was active remain on the snippet.

---

### User Story 12 - Personal AI provider settings *(built, not in formal requirements — see Scope Reconciliation)* (Priority: P4)

A user configures a personal AI provider integration (type, API key, model, base URL) for potential future AI-assisted features.

**Why this priority**: No consuming feature currently uses this configuration (confirmed: no code path calls out to an AI provider) — lowest priority, delivers no end-user value until something is built on top of it, and isn't part of the formal requirements at all.

**Independent Test**: Save AI settings, confirm `GET` never returns the raw API key, update non-key fields and confirm the key remains configured.

**Acceptance Scenarios**:

1. **Given** no existing AI settings, **When** a user submits provider config including an API key, **Then** a settings row is created for that account only, key encrypted at rest.
2. **Given** existing settings, **When** resubmitted, **Then** it upserts rather than duplicating (one row per user).
3. **Given** any `GET` of AI settings, **When** returned, **Then** the raw API key is never included.

---

### User Story 13 - Share a snippet with specific users (Priority: P3)

A snippet owner shares a snippet with specific registered users, identified by their email or username. Each recipient gains read-only access to the snippet — they can view its title, description, code, language, and tags, and participate in its comments (User Story 11), but cannot edit or delete it, change its collection or tags, or manage its shares. Recipients see snippets shared with them in a dedicated "shared with me" listing. The owner can view the current recipient list and revoke any recipient at any time, immediately ending that recipient's access. This mechanism is independent of the snippet's public/private visibility setting (User Story 5): a private snippet can be shared with users, and revoking a user share does not affect the public link or vice versa.

**Why this priority**: Delivers the "development teams" value proposition (shared institutional knowledge) with a deliberately small surface — targeted per-snippet sharing rather than full team workspaces, which remain out of scope. Depends on core CRUD (US2) but nothing else; comments scoping (US11) depends on it.

**Independent Test**: As user A, share an owned private snippet with user B by email; as B, confirm the snippet appears in "shared with me" and its content is viewable but edit/delete/share actions are rejected; as A, view the recipient list showing B, then revoke B; as B, confirm the snippet no longer appears in "shared with me" and direct access by ID is rejected.

**Acceptance Scenarios**:

1. **Given** a snippet's owner and an identifier (email or username) of a registered user, **When** the owner shares the snippet with them, **Then** a share is recorded for that recipient, at most one share exists per snippet-recipient pair (re-sharing is idempotent, not duplicated), and the recipient gains read-only access.
2. **Given** a recipient of a shared snippet, **When** they view it, **Then** they see title, description, code, language, and tags, but any attempt to edit, delete, retag, recollect, or manage shares on it is rejected — read-only means read-only at the enforcement level, not just hidden UI.
3. **Given** a recipient, **When** they open their "shared with me" listing, **Then** every snippet currently shared with them appears, and none appears after its share is revoked or its snippet is deleted.
4. **Given** the owner revokes a recipient, **When** the revocation completes, **Then** that recipient's access (snippet view, comments read/post, "shared with me" presence) ends immediately.
5. **Given** a non-owner of a snippet (including a recipient), **When** they attempt to share it with someone or list its recipients, **Then** the request is rejected — share management is owner-only.
6. **Given** a share attempt naming an identifier that matches no registered account, **When** submitted, **Then** it fails without revealing more about account existence than the sharing operation inherently requires, and the failure response is indistinguishable in shape from other share-validation failures.
7. **Given** an owner attempts to share a snippet with themselves, **When** submitted, **Then** it is rejected as invalid rather than creating a meaningless share.
8. **Given** a shared snippet is deleted, or the recipient's account is deleted, **When** the deletion completes, **Then** the associated shares are removed with it and no orphaned share records remain.

---

### User Story 14 - Workspace creation and membership management (Priority: P2)

A regular user creates a named workspace and automatically becomes its Workspace Owner. The Owner (or a Workspace Admin) invites other registered users by email or username, assigning each a workspace role — Workspace Admin or Workspace Member — and can change a member's role or remove a member at any time. A member can leave a workspace voluntarily. The Owner can transfer ownership to another member or delete the workspace entirely. Workspace roles are entirely separate from the platform-level regular-user/administrator role (User Story 7): a platform-regular user can be a Workspace Owner, and platform administrators get no implicit workspace access.

**Why this priority**: The workspace container must exist before any workspace-scoped content (US15) or role enforcement (US16) is meaningful; it directly serves the "development teams" target users with a real shared boundary rather than only per-snippet grants.

**Independent Test**: As user A, create a workspace and confirm A is its Owner; invite user B as Member and user C as Admin; as C, remove B; as B, confirm all workspace access is gone; as A, transfer ownership to C, confirm A is demoted to Admin and C holds Owner powers; as C, delete the workspace, confirm it and its memberships are gone.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they create a workspace with a name, **Then** the workspace is created with a unique identifying slug, a creation timestamp, and exactly one Owner — the creator.
2. **Given** a Workspace Owner or Admin and an email/username of a registered user, **When** they invite that user with a role, **Then** a membership is recorded with that role; at most one membership exists per user-workspace pair, and re-inviting an existing member does not duplicate it. Failed recipient resolution reveals no more about account existence than the invitation inherently requires.
3. **Given** a Workspace Admin, **When** they attempt to remove the Owner, change the Owner's role, or delete the workspace, **Then** the request is rejected — those actions are Owner-only.
4. **Given** a Workspace Member, **When** they attempt any membership-management action (invite, remove, change roles), **Then** the request is rejected.
5. **Given** a member who is not the Owner, **When** they leave the workspace, **Then** their membership is removed and their workspace access ends; the Owner cannot leave without first transferring ownership or deleting the workspace — a workspace never exists without exactly one Owner.
6. **Given** the Owner, **When** they transfer ownership to another current member, **Then** that member becomes the sole Owner and the previous Owner becomes a Workspace Admin.
7. **Given** a user, **When** they view their workspace list, **Then** they see every workspace they hold a membership in, with their role.

---

### User Story 15 - Workspace snippet lifecycle and team collections (Priority: P2)

A workspace member creates snippets inside a workspace, making them visible to all members of that workspace. Collections can likewise be workspace-scoped: a workspace snippet can only be assigned to a collection belonging to the same workspace (never to a personal collection, and never to another workspace's collection), and deleting a workspace collection uncategorizes its snippets without deleting them. Tags remain a single global registry; when working inside a workspace, tag filtering applies within that workspace's snippets, and members can toggle or combine their personal context and workspace context when browsing and searching. A snippet is always in exactly one scope — personal or one workspace — and can be moved between scopes under explicit rules (see Edge Cases and FR-020).

**Why this priority**: This is the payoff of US14 — the actual shared content. Without it a workspace is an empty shell.

**Independent Test**: As member B of a workspace, create a snippet in the workspace and confirm member C sees it in the workspace listing without any explicit share; create a workspace collection and assign the snippet; attempt to assign the workspace snippet to a personal collection and confirm rejection; delete the workspace collection and confirm the snippet survives uncategorized; filter the workspace by a tag and confirm only that workspace's matching snippets return.

**Acceptance Scenarios**:

1. **Given** a workspace member, **When** they create a snippet in that workspace, **Then** it is recorded as workspace-scoped with the member as its creator, and every active member sees it in the workspace's snippet listing.
2. **Given** a workspace snippet and a collection, **When** assignment is attempted, **Then** it succeeds only if the collection belongs to the same workspace; personal collections and other workspaces' collections are rejected. The same-scope rule applies symmetrically: personal snippets cannot join workspace collections.
3. **Given** a workspace collection is deleted, **When** the deletion completes, **Then** its snippets become uncategorized within the workspace, not deleted.
4. **Given** a tag from the global registry, **When** attached to a workspace snippet, **Then** the same global tag row is reused (no workspace-local duplicate), and filtering by that tag inside the workspace returns only that workspace's snippets carrying it.
5. **Given** a member browsing or searching, **When** they select personal context, a workspace context, or a combined view, **Then** results respect the selected scope(s) — workspace snippets never appear in another user's personal-only view and personal snippets never appear in a workspace listing.
6. **Given** a non-member, **When** they attempt to view, list, or search a workspace's snippets or collections by any means, **Then** the request is rejected.

---

### User Story 16 - Workspace role enforcement and comments (Priority: P2)

Workspace roles govern what each member can do with workspace content, enforced on every request: all active members read all workspace snippets and comment on them; a Member edits and deletes only snippets they created; Admins and the Owner edit and delete any workspace snippet and manage workspace collections; membership management follows User Story 14. Comments on a workspace snippet open automatically to all active members — no per-snippet sharing step is needed — while comment edit/delete remains author-only (User Story 11's rule, unchanged). Access is evaluated per request against current membership: removal or leaving takes effect on the very next request, with no lingering client-side entitlement, consistent with the server-side session model.

**Why this priority**: US14/US15 without enforcement would be a labeling scheme, not a data boundary; this story is what makes the workspace an actual access-control perimeter.

**Independent Test**: In a workspace with Owner A, Admin C, Member B: as B, edit B's own workspace snippet (succeeds) and attempt to edit C's snippet (rejected); as C, edit B's snippet (succeeds); as B, comment on C's snippet without any explicit share (succeeds, author identity shown); remove B from the workspace, then as B confirm the snippet, its comments, and the workspace listing are all rejected on the next request; confirm B's past comments remain visible to remaining members.

**Acceptance Scenarios**:

1. **Given** any active member of a workspace, **When** they request any snippet in that workspace or its comments, **Then** read access succeeds; **Given** any non-member (regardless of platform role), **Then** it is rejected.
2. **Given** a Workspace Member, **When** they edit or delete a workspace snippet they created, **Then** it succeeds; **When** they attempt the same on a snippet created by someone else, **Then** it is rejected.
3. **Given** a Workspace Admin or the Owner, **When** they edit or delete any snippet or collection in the workspace, **Then** it succeeds.
4. **Given** an active member viewing a workspace snippet, **When** they post a comment, **Then** it is saved with their author identity and visible to all members — no user-to-user share (User Story 13) is required or involved for workspace snippets.
5. **Given** a member is removed or leaves mid-session, **When** they make their next request touching the workspace or its content, **Then** it is rejected — entitlement is re-evaluated server-side per request, never cached in the client.
6. **Given** a comment on a workspace snippet, **When** anyone other than its author attempts to edit or delete it, **Then** it is rejected; comments by a removed member remain on the snippet, attributed to them.

### Edge Cases

- What happens when a user's session cookie is valid but the underlying user row has been deleted (e.g. an administrator deleted the account, or deleted it from another device mid-session)? Every protected route must handle a missing user gracefully, not throw an unhandled error.
- What happens when two tabs edit the same snippet concurrently? Last-write-wins is the current implicit behavior — acceptable for a single-owner-per-snippet model; revisit only if real multi-editor collaboration is ever added.
- What happens when a public snippet's share link is requested at a rate suggesting scraping/abuse? Not addressed by any current requirement — flagged as an open question, not assumed out of scope.
- What happens when an administrator deactivates their own account, or the last remaining administrator account? Needs an explicit rule (e.g. disallow, or require at least one active administrator) rather than being left to whatever the deactivation code happens to do.
- What happens when a collection is deleted while a snippet inside it is being edited in another tab? The snippet's collection reference becomes null; the editing client should not silently keep referencing a deleted collection.
- What happens when a recipient is viewing a shared snippet at the moment the owner revokes the share? Their next request for that snippet (or its comments) is rejected; already-rendered content on screen is acceptable staleness.
- What happens to comments authored by a recipient whose share is later revoked, or whose account is deleted? Revocation leaves their past comments on the snippet; account deletion removes their comments along with all their owned data (User Story 8 cascade).
- What happens when the owner shares with a user who is later deactivated by an administrator (User Story 7)? The share record may persist, but a deactivated account cannot authenticate, so no access is exercisable through it.
- What happens to workspace snippets when the Owner deletes the workspace? **Decision: cascade delete.** The workspace, its memberships, its collections, and its workspace-scoped snippets (with their versions, comments, tags associations, and any residual records) are permanently removed. The alternative — archiving or converting content to some member's personal scope — was considered and rejected: it silently reassigns ownership of team content to an individual and requires an archival surface this product doesn't have. Deletion must be an explicit, confirmed, Owner-only action precisely because it is destructive; members who want to keep a snippet move it to personal scope (below) before deletion.
- What happens when a user is removed from a workspace (or leaves) mid-session while viewing a workspace snippet? There are no client-held entitlements to revoke — auth is a server-side session, and workspace access is re-checked against current membership on every request. The removal deletes the membership record, so the user's very next request touching that workspace's content is rejected; whatever is already rendered on their screen is acceptable staleness, mirroring the US13 revocation rule.
- What happens when a user tries to move a personal snippet into a workspace, or a workspace snippet to personal scope? Personal → workspace: allowed only if the mover owns the snippet and is an active member of the target workspace; the snippet becomes workspace-scoped, its personal collection assignment is stripped (personal collections cannot hold workspace snippets), and its US13 user-to-user shares are removed — workspace membership now governs access. Workspace → personal: allowed only for the snippet's creator, a Workspace Admin, or the Owner; the snippet moves into the mover's own personal scope, its workspace collection assignment is stripped, and it disappears from the workspace listing. Both directions preserve the snippet's content, versions, comments, and tag associations.
- What happens when the same person is invited to a workspace under two identifiers (their email and their username)? Both resolve to the same account, so the uniqueness rule (one membership per user-workspace pair) makes the second invite a no-op, not a duplicate.
- What happens when a Workspace Owner deletes their entire account (User Story 8)? Rejected while they still own any workspace — the exactly-one-Owner invariant extends the owner-leave rule: they must transfer ownership or delete each owned workspace first. Silently cascading a team's entire workspace off one member's personal account deletion would destroy shared data as a side effect.

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
- **FR-012**: System MUST reject any request to view, modify, or delete another user's owned resource via direct ID access regardless of that resource's visibility setting — visibility only governs the public share-link path (FR-007), and read access additionally extends to explicit share recipients per FR-014; no other non-owning, non-administrator user gets direct API access.
- **FR-013** *(existing, not in formal requirements)*: System MAY continue to support snippet version history/restore and per-user AI provider settings as already implemented, pending an explicit product decision to formalize, change, or deprecate each. Comments are no longer covered by this clause — they are formalized under FR-015.
- **FR-014**: System MUST allow a snippet's owner (and only the owner) to share that snippet with specific registered users resolved by email or username, to list its current recipients, and to revoke any recipient at any time. A recipient gains read-only access to the snippet's title, description, code, language, and tags, and the snippet appears in their "shared with me" listing; recipients MUST NOT be able to edit, delete, retag, recollect, or manage shares on it. At most one share exists per snippet-recipient pair; self-sharing is rejected; shares are removed automatically when the snippet or the recipient's account is deleted. Recipient resolution MUST NOT reveal more about account existence than the sharing operation inherently requires.
- **FR-015**: System MUST restrict viewing and posting comments on a personal snippet to its owner and its current share recipients, verified on every request (closing the recorded defect where no snippet-access check was performed); each returned comment MUST include its author's identity (username/display name); editing and deleting a comment MUST remain restricted to that comment's author; comments MUST be removed when their snippet is deleted; revoking a share ends the former recipient's comment access but leaves their existing comments in place. For workspace-scoped snippets, comment access extends to all active workspace members per FR-019.
- **FR-016**: System MUST allow any authenticated user to create a workspace (name, unique slug, creation timestamp), making the creator its sole Workspace Owner; MUST support Owner/Admin-managed membership of registered users resolved by email or username, each membership carrying exactly one workspace role (Workspace Owner, Workspace Admin, or Workspace Member) with at most one membership per user-workspace pair (idempotent re-invites); MUST support role changes, member removal, voluntary leaving (except by the Owner), Owner-only ownership transfer (previous Owner becomes Admin), and Owner-only workspace deletion. A workspace MUST have exactly one Owner at all times. Membership resolution MUST NOT reveal more about account existence than the invitation inherently requires.
- **FR-017**: System MUST support a dual scope for snippets and collections — personal (as before) or belonging to exactly one workspace. A workspace-scoped snippet MUST only be assignable to a collection of that same workspace, and a personal snippet only to a personal collection of its owner; deleting a workspace collection MUST uncategorize, not delete, its snippets. Tags MUST remain a single global registry with no workspace-local duplicates; tag filtering MUST apply within the selected scope. Listing and search MUST let a user select personal context, a workspace context, or a combined view, with no leakage of workspace content to non-members or of one user's personal content into any workspace view.
- **FR-018**: System MUST enforce workspace roles at the route level on every request, evaluated against current membership (no client-cached entitlement): all active members read all workspace snippets and collections; Members create workspace content and edit/delete only snippets they created; Admins and the Owner edit/delete any workspace snippet and manage workspace collections; membership management is restricted per FR-016. Platform administrators (FR-009) receive no implicit workspace access; workspace roles confer no platform-level privileges.
- **FR-019**: System MUST automatically extend comment viewing and posting on a workspace-scoped snippet to all active members of that workspace — no per-snippet grant involved — while preserving author-only comment edit/delete and author identity display (FR-015). Removal from the workspace MUST end comment access on the next request while leaving the former member's existing comments in place, attributed to them.
- **FR-020**: System MUST support moving a snippet between scopes: personal → workspace only by the snippet's owner into a workspace they are an active member of, stripping its personal collection assignment and removing its user-to-user shares (FR-014) in the same operation; workspace → personal only by the snippet's creator, a Workspace Admin, or the Owner, into the mover's own personal scope, stripping its workspace collection assignment. Content, versions, comments, and tag associations MUST be preserved across a move. Workspace deletion MUST cascade: memberships, workspace collections, and workspace-scoped snippets (with their dependent records) are permanently removed, and the action MUST be Owner-only and explicitly confirmed.

### Key Entities

- **User**: account identity (username, email, password hash, role [regular/administrator], display name, bio, avatar, registration timestamp).
- **Snippet**: core content unit (title, code, language [predefined allowlist], description, visibility [public/private], share token, optional collection, creator, created/last-modified timestamps); scoped to exactly one of: its creator's personal space, or one workspace.
- **Collection**: named grouping of snippets (name, optional description, creation timestamp); scoped to exactly one of: its owning user's personal space, or one workspace; may only contain snippets of its own scope.
- **Tag**: global label, many-to-many with snippets.
- **SnippetVersion** *(existing, not in formal requirements)*: immutable historical snapshot of a snippet's code.
- **Comment**: user-authored annotation on a snippet, visible to the snippet's owner and share recipients; carries author identity; removed with its snippet.
- **SnippetShare**: grant of read-only access on one **personal** snippet to one recipient user; unique per snippet-recipient pair; removed automatically when the snippet or the recipient account is deleted, or when the snippet moves into a workspace; carries an access level that defaults to view-only so future levels (e.g. comment-only vs. view-only distinctions) can be added without restructuring.
- **Workspace**: named team environment (name, unique slug, creation timestamp) acting as a distinct data boundary; contains members via WorkspaceMembership; owns workspace-scoped snippets and collections; always has exactly one Workspace Owner; deletion cascades to memberships and all workspace-scoped content. *(Storage-level definition: `data-model.md`.)*
- **WorkspaceMembership**: association of one user to one workspace with exactly one workspace role (Workspace Owner / Workspace Admin / Workspace Member); unique per user-workspace pair; removed on leaving, removal, workspace deletion, or account deletion. *(Storage-level definition: `data-model.md`.)*
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
- **SC-007**: A revoked share recipient's next request against the affected snippet (content or comments) is rejected — revocation takes effect within one request cycle, mirroring SC-004 for public links.
- **SC-008**: No authenticated user can read or post comments on any snippet they neither own, nor have been granted a share to, nor can access via active workspace membership, verified by direct-ID probing across every comment operation.
- **SC-009**: No workspace content (snippets, collections, comments, member list) is ever returned to a non-member, verified by direct-ID probing as an authenticated non-member and as a platform administrator without membership.
- **SC-010**: A removed or departed workspace member's next request against that workspace or any of its content is rejected — access ends within one request cycle of the membership change.
- **SC-011**: Deleting a workspace leaves zero orphaned rows tied to it (memberships, workspace snippets, workspace collections, and their dependent records), mirroring SC-005's cascade guarantee at the workspace level.

## Assumptions

- ~~There is no team/organization/shared-workspace concept in this spec~~ **Superseded 2026-07-07**: Team Workspaces (US14–US16) are now in scope, reversing this spec's earlier assumption. The workspace model is deliberately bounded: a flat set of workspaces (no nesting, no organizations-of-workspaces), three fixed roles, membership by direct invite of existing registered accounts only (no email invitations to non-users, no invite links, no notifications), and no per-workspace settings beyond name/slug. Billing, quotas, and audit logs remain out of scope.
- User-to-user sharing (US13) grants read-only access at a single level and applies to **personal snippets only** — workspace snippets are governed exclusively by workspace membership (US16), and moving a snippet into a workspace removes its individual shares (FR-020). The share record carries an access level defaulting to view-only purely as future-proofing; no second level (e.g. edit access) is specified or implemented under this spec.
- Workspace roles are fixed at three (Owner/Admin/Member) with the permission matrix in US16; custom roles or per-snippet permission overrides inside a workspace are not in scope.
- Workspace deletion cascades content permanently (see Edge Cases); no archive, soft-delete, or trash surface exists anywhere in the product, and workspaces don't introduce one.
- Share recipients do not receive notifications when a snippet is shared with them; discovery is via the "shared with me" listing. Notifications, if wanted, are a future feature.
- The predefined language allowlist (FR-004) starts from the list given in the formal requirements (JavaScript, Python, Java, C++, SQL, Go, Rust, TypeScript) and can grow, but is a closed list enforced server-side, not open free text — this resolves the earlier open question about whether `snippet.language` should be an enum: yes, per the formal requirements' explicit "predefined list" language.
- Tags remain global (not per-user), an intentional decision already reflected in the schema and unchanged by the formal requirements, which describe "a global tag registry" consistent with the existing design.
- Deployment-mode-specific requirements (NFR-005, NFR-008 self-hosted vs. SaaS distinctions) are captured here as requirements to plan for, not yet resolved into a concrete architecture — that resolution belongs in `plan.md`.
- No automated test suite exists yet; acceptance scenarios above are the manual verification contract until test tooling is introduced as its own effort.
