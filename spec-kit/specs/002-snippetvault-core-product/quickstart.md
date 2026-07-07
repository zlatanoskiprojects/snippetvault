# Quickstart Validation: User-to-User Sharing, Scoped Comments & Team Workspaces

**Date**: 2026-07-07 (rev 2 adds workspace scenarios) | Validates US13 + US11 against `./contracts/sharing-api.md`, and US14–US16 against `./contracts/workspace-api.md`.

## Prerequisites

```bash
docker compose up -d          # Postgres 16 (repo root)
cd backend && npm run dev     # API on :3000
cd frontend && npm run dev    # SPA on :5173 (for UI checks)
```

Two test accounts via `POST /api/auth/register`: user A (owner) and user B (recipient). A third account C for negative checks. Use `curl -c a.jar -b a.jar` style cookie jars per user.

## Scenario 1 — Share and read (US13 s1–s3)

1. As A: create a private snippet → note `id`.
2. As A: `POST /api/snippets/:id/shares` with B's email → expect `201` with B's identity; repeat → expect `200`, and `GET .../shares` still lists B exactly once.
3. As B: `GET /api/snippets/shared-with-me` → snippet present with `owner` block; `GET /api/snippets/:id` → `200` with `is_owner: false`.
4. As B: `PATCH /api/snippets/:id`, `DELETE /api/snippets/:id`, `POST /api/snippets/:id/shares` (sharing to C) → all `404`.
5. As C: `GET /api/snippets/:id` → `404`.

## Scenario 2 — Comments scoping (US11 s1–s4, SC-008)

1. As A: post a comment; as B: `GET .../comments` → A's comment visible with `author_username`; B posts a reply → `201`.
2. As C: `GET` and `POST` on `.../comments` → both `404` (defect fix — previously these succeeded).
3. As A: attempt `PATCH /api/comments/:bCommentId` → `404` (author-only); B edits/deletes their own → `200`.

## Scenario 3 — Revocation (US13 s4, US11 s6, SC-007)

1. As A: `DELETE /api/snippets/:id/shares/:bUserId` → `200`.
2. As B: snippet gone from `shared-with-me`; direct `GET` snippet and comments `GET`/`POST` → `404` on the very next request.
3. As A: comments list still shows B's past comment with author identity.

## Scenario 4 — Enumeration & self-share (US13 s6–s7)

1. As A: share with a nonexistent email → `404 { "error": "Snippet or recipient not found" }`; compare byte-shape with sharing a snippet A doesn't own → identical shape.
2. As A: share with A's own email → `400`.

## Scenario 5 — Cascades (US13 s8, SC-005)

1. As A: delete the snippet → `SELECT count(*) FROM snippet_share WHERE snippet_id = :id` → 0; comments gone too.
2. Re-create + re-share; delete B's account via profile deletion → share rows for B gone, B's comments gone.

## Scenario 6 — Workspace lifecycle & membership (US14)

1. As A: `POST /api/workspaces` → A is `owner`; invite B as `member`, C as `admin`; re-invite B → `200`, member list unchanged.
2. As C (admin): remove B → `200`; attempt `DELETE /api/workspaces/:id` and removing A → both rejected (owner-only).
3. As B (member, re-invited): attempt any member management → `404`.
4. As A: attempt to leave → `400` transfer-first; `POST .../transfer` to C → C is `owner`, A is `admin`; as A attempt account deletion while owning another workspace → rejected.

## Scenario 7 — Workspace content & same-scope rule (US15)

1. As B: create a snippet with `workspace_id` set → C sees it in `GET /api/workspaces/:id/snippets` with creator identity, no explicit share involved.
2. As B: create a workspace collection, assign the snippet → `200`; attempt to assign the workspace snippet to B's personal collection → `400`; delete the workspace collection → snippet survives uncategorized.
3. As B: tag the workspace snippet with an existing global tag → same tag row reused; filtering the workspace listing by that tag returns only workspace matches; B's personal listing does not contain the workspace snippet unless the combined scope is selected.
4. As a non-member D: workspace listing, snippet by ID, and search → all `404`/empty of workspace content.

## Scenario 8 — Role enforcement, comments, eviction (US16, SC-009/SC-010)

1. As B (member): edit own workspace snippet → `200`; edit C's → `404`. As C (admin): edit B's → `200`.
2. As B: comment on C's workspace snippet → `201`, visible to all members with author identity; author-only edit/delete still enforced.
3. Remove B mid-session (no logout): B's very next request to the workspace, the snippet, or its comments → `404`; B's past comments remain, attributed.
4. As a platform administrator with no membership: workspace content by direct ID → `404` (no admin bypass).

## Scenario 9 — Scope moves & cascade delete (FR-020, SC-011)

1. As A: share a personal snippet with D (US13), then `POST /api/snippets/:id/move` into the workspace → collection stripped, `snippet_share` rows for it now zero, D loses access, members gain it.
2. As B: move own workspace snippet to personal → gone from workspace listing, present in B's personal list, comments/versions/tags intact.
3. As the Owner: delete the workspace → `SELECT count(*)` on `workspace_membership`, workspace-scoped `snippet` and `collection` for that id → all 0; personal content untouched.

## UI spot-checks (frontend)

- Owner sees a Share action on `SnippetDetailPanel` opening `ShareDialog` (recipient list, add by email/username, revoke).
- Recipient sees "Shared with me" in the sidebar; opening a shared snippet renders read-only (no edit/delete/tag/collection affordances) but with a working comment composer showing author names.
- Public share link page (US5), when built, shows no comments regardless of shares.
- Sidebar `ScopeSwitcher` toggles personal / workspace / combined context; `WorkspaceView` shows the members panel with management actions only for Admin/Owner roles.
- `WorkspaceDialog` covers create/invite/role-change/transfer/delete; destructive actions (delete workspace, remove member) go through the `AlertDialog` primitive.
- A Member viewing another member's workspace snippet sees comment composer enabled but no edit/delete affordances (`can_edit: false`).