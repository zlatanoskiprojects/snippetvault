# API Contract: Team Workspaces

**Date**: 2026-07-07 | **Stories**: US14–US16 | **Wire format**: snake_case JSON, session cookie auth, all endpoints behind `authMiddleware`. Role checks are per-request membership lookups (`lib/workspaceAccess.ts`) — no cached entitlements.

## Workspace lifecycle (US14)

### `GET /api/workspaces`
Workspaces the requester holds a membership in.

```json
200: [
  { "id": 4, "name": "Platform Team", "slug": "platform-team", "role": "owner", "member_count": 3, "created_at": "..." }
]
```

### `POST /api/workspaces`
Body: `{ "name": "<1..100 chars>" }`. Creates the workspace, generates a unique URL-safe slug from the name, inserts the creator's `owner` membership in the same transaction. `201` → workspace object.

### `GET /api/workspaces/:id`
Members only → workspace object + members array (each: `user_id`, `username`, `display_name`, `role`, `created_at`). Non-member → `404`.

### `PATCH /api/workspaces/:id`
Rename (name only; slug is stable once created). Owner or Admin. `404` otherwise.

### `DELETE /api/workspaces/:id`
Owner only. Cascades memberships, workspace collections, workspace snippets and their dependents (SC-011). `404` for anyone else, including Admins.

## Membership management (US14)

### `POST /api/workspaces/:id/members`
Owner/Admin. Body: `{ "recipient": "<email-or-username>", "role": "admin" | "member" }` (`owner` not assignable here — only via transfer).
`201` created / `200` already a member (idempotent) / `404 { "error": "Workspace or recipient not found" }` (covers non-member requester, insufficient role, and unknown recipient in one shape — anti-enumeration) / `400` validation or self-invite.

### `PATCH /api/workspaces/:id/members/:userId`
Change role between `admin` ↔ `member`. Owner/Admin; nobody may change the Owner's role. `400` if target role is `owner` (use transfer).

### `DELETE /api/workspaces/:id/members/:userId`
Remove a member (Owner/Admin), or leave (`:userId` = self, any role except Owner). Removing/leaving the Owner → `400 { "error": "Transfer ownership first" }`. Takes effect on the removed user's next request.

### `POST /api/workspaces/:id/transfer`
Owner only. Body: `{ "user_id": <current member> }`. Atomically: target becomes `owner`, previous Owner becomes `admin`.

## Workspace content (US15)

### `GET /api/workspaces/:id/snippets` and `GET /api/workspaces/:id/collections`
Members only. Same wire shapes as the personal listings plus `creator` identity (`user_id`, `username`, `display_name`) per row. Existing search/filter/sort params from `GET /api/snippets` apply to the snippet listing.

### `POST /api/snippets` (existing, extended)
Optional `workspace_id` in the body → creates a workspace-scoped snippet (requester must be an active member; `404` otherwise). Same for `POST /api/collections`.

### Collection assignment (existing `PATCH /api/snippets/:id`, extended)
`collection_id` must reference a collection of the **same scope**: same `workspace_id` for workspace snippets, requester-owned personal collection for personal snippets. Cross-scope assignment → `400`.

### `POST /api/snippets/:id/move` (FR-020)
Body: `{ "workspace_id": <id> }` (personal → workspace) or `{ "workspace_id": null }` (workspace → personal).
- Personal → workspace: requester must be the snippet's owner **and** an active member of the target; strips `collection_id`, deletes the snippet's `snippet_share` rows, sets `workspace_id` — one transaction.
- Workspace → personal: requester must be the creator, an Admin, or the Owner; snippet moves to the **requester's** personal scope (`user_id` set to requester if they aren't the creator), strips `collection_id`.
- Content, versions, comments, tag links preserved. `404` on missing access, `400` on no-op moves.

## Role-governed snippet mutations (US16)

Existing snippet routes switch from owner-only to `canEditSnippet`:
- `PATCH /api/snippets/:id`, `DELETE /api/snippets/:id`, tag attach/detach, version restore/delete — personal: owner; workspace: creator or Admin/Owner
- Reads (`GET /api/snippets/:id`, versions list) use `canAccessSnippet` (owner / share recipient / active member); response carries `can_edit: boolean` alongside `is_owner`

## Comments on workspace snippets (US16 / FR-019)

No new endpoints. `GET`/`POST /api/snippets/:snippetId/comments` already gate on `canAccessSnippet`, which now includes active membership — all members read/post automatically. Author-only `PATCH`/`DELETE` unchanged; a removed member's comments persist, attributed via the author identity fields from `contracts/sharing-api.md`.

## Error conventions

Same as `sharing-api.md`: `401` unauthenticated; `400` validation / invariant violations that don't leak existence; `404` uniformly for not-found and not-authorized; `500` generic. Workspace role failures use `404` (resource-shaped) except explicit invariant messages called out above (`400` owner-leave/transfer-first, cross-scope assignment, self-invite).