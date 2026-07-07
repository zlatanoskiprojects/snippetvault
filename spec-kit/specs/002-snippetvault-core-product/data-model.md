# Data Model: SnippetVault Core Product

**Date**: 2026-07-07 (rev 2: Team Workspaces) | **Plan**: `./plan.md` | **Authoritative schema**: `backend/src/db/schema.ts` (Drizzle — the SQL below is the conceptual contract; the Drizzle definitions and generated migrations under `backend/drizzle/` are the executable source of truth)

## Existing Entities (unchanged by the 2026-07-07 scope addition)

| Table | Purpose | Key fields / constraints |
|---|---|---|
| `users` | Account identity | `id` PK; `email` unique; `password_hash`; `role` default `'user'`; `display_name`, `bio`, `avatar_url` nullable |
| `collection` | Named snippet grouping | `user_id` FK → users, cascade |
| `snippet` | Core content unit | `user_id` FK cascade; `collection_id` FK set-null, nullable; `visibility` default `'private'`; `share_token` nullable (US5 public link); auto `created_at`/`updated_at` |
| `tag` | Global label | `name` unique — intentionally not per-user |
| `snippet_tag` | Snippet↔tag junction | composite PK (`snippet_id`, `tag_id`), both FK cascade |
| `snippet_version` | Immutable code snapshot | `snippet_id` FK cascade; `version_number` |
| `comment` | Annotation on a snippet | `user_id` FK cascade (author); `snippet_id` FK cascade; auto timestamps — **no column changes needed for US11**; the access rule and author identity are query/route-level concerns |
| `user_ai_settings` | Per-user AI provider config | unique on `user_id` (upsert target); `api_key_enc` encrypted at rest |

## New Entity: `snippet_share` (US13)

Grant of read-only access on one snippet to one recipient user.

| Column | Type | Constraints |
|---|---|---|
| `id` | serial | PK |
| `snippet_id` | integer | not null, FK → `snippet.id`, `onDelete: 'cascade'` |
| `user_id` | integer | not null, FK → `users.id`, `onDelete: 'cascade'` — the **recipient**, not the owner (owner is derivable via `snippet.user_id`) |
| `permission` | varchar(10) | not null, default `'view'` — single level implemented; column exists so future levels don't need a migration that backfills semantics |
| `created_at` | timestamptz | not null, default now |

**Constraints & indexes**

- `unique(snippet_id, user_id)` — at most one share per pair; the share POST is idempotent via `onConflictDoNothing` against this constraint
- Index on `snippet_id` (recipient-list lookups, access-predicate joins)
- Index on `user_id` ("shared with me" listing)

**Invariants**

- The recipient is never the snippet's owner (self-share rejected at the route level; not a DB constraint since it spans two tables)
- Cascade on either FK means snippet deletion or recipient account deletion removes the share — no orphaned rows (SC-005)
- Revocation is a hard delete of the row; past comments by the revoked recipient are not touched (FR-015)

## New Entities: `workspace` and `workspace_membership` (US14, rev 2)

Conceptual PostgreSQL definitions (implemented via Drizzle in `backend/src/db/schema.ts`):

```sql
CREATE TABLE workspace (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE workspace_membership (
    id            SERIAL PRIMARY KEY,
    workspace_id  INTEGER NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    role          VARCHAR(10) NOT NULL DEFAULT 'member'
                  CHECK (role IN ('owner', 'admin', 'member')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, user_id)
);

CREATE INDEX workspace_membership_workspace_id_idx ON workspace_membership(workspace_id);
CREATE INDEX workspace_membership_user_id_idx      ON workspace_membership(user_id);
```

## Scope Refactor: `snippet` and `collection` gain a nullable workspace reference (US15, rev 2)

```sql
ALTER TABLE snippet
    ADD COLUMN workspace_id INTEGER REFERENCES workspace(id) ON DELETE CASCADE;

ALTER TABLE collection
    ADD COLUMN workspace_id INTEGER REFERENCES workspace(id) ON DELETE CASCADE;

CREATE INDEX snippet_workspace_id_idx    ON snippet(workspace_id);
CREATE INDEX collection_workspace_id_idx ON collection(workspace_id);
```

Semantics:

- `workspace_id IS NULL` → personal scope (all pre-existing rows, no backfill needed); non-null → workspace scope
- `snippet.user_id` / `collection.user_id` keep their meaning as **creator** in workspace scope (still the ownership anchor in personal scope)
- `ON DELETE CASCADE` on both new FKs implements the workspace-deletion decision (spec Edge Cases): deleting a workspace removes its snippets and collections, and their dependent rows (versions, comments, tag links) fall via the existing cascades — satisfies SC-011
- `snippet.collection_id` keeps `ON DELETE SET NULL`, so deleting a workspace collection alone still only uncategorizes

**Invariants enforced at the route level (not expressible as simple column constraints)**

- Exactly one `role = 'owner'` membership per workspace: creation inserts it; ownership transfer demotes-then-promotes in one transaction; owner leave/removal rejected; Owner account deletion rejected while owned workspaces exist
- Same-scope collection rule: `snippet.workspace_id IS NOT DISTINCT FROM collection.workspace_id`, plus personal collections must belong to the snippet's owner (existing check)
- `snippet_share` rows may only reference personal snippets; a personal→workspace move deletes the snippet's shares in the same transaction (FR-020)

## Access rules (derived, not stored)

- `canAccessSnippet(snippetId, userId)` ≔ creator/owner (`snippet.user_id = userId`) **OR** active share (`snippet_share` row — personal snippets only) **OR** active membership (`workspace_membership` row on `snippet.workspace_id`)
- `canEditSnippet(snippetId, userId)` ≔ personal: `snippet.user_id = userId`; workspace: creator, or membership `role IN ('admin', 'owner')`
- Membership is looked up per request — never cached in the session — so removal/leaving takes effect on the next request (SC-010) under server-side session auth

Applied to: snippet read, comment list/create (`canAccessSnippet`); snippet PATCH/DELETE, tag/untag, collection reassignment, version mutations (`canEditSnippet`). Share management stays personal-owner-only; membership management follows the role matrix in spec US14/US16. The anonymous public-link path (US5) bypasses both predicates — it resolves by `share_token` + `visibility = 'public'` and never exposes comments. Platform admin role grants no implicit workspace access (FR-018).

## Migrations

1. *(rev 1)* Additive: create `snippet_share` with its constraints/indexes. No changes to existing tables, no backfill.
2. *(rev 2)* Additive: create `workspace` + `workspace_membership`; add nullable `workspace_id` to `snippet` and `collection` with the indexes above. No backfill — `NULL` correctly classifies every existing row as personal.