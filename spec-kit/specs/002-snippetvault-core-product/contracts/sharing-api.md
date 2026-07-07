# API Contract: User-to-User Sharing & Scoped Comments

**Date**: 2026-07-07 | **Stories**: US13 (sharing), US11 (comments) | **Wire format**: snake_case JSON, session cookie auth (`credentials: 'include'`), all endpoints behind `authMiddleware`.

## Share management (owner-only)

### `GET /api/snippets/:id/shares`
List current recipients. Owner-only — 404 if the snippet doesn't exist **or** isn't owned by the requester (same shape, no existence leak).

```json
200: [
  {
    "id": 12,
    "snippet_id": 7,
    "user_id": 3,
    "username": "mira",
    "display_name": "Mira K",
    "permission": "view",
    "created_at": "2026-07-07T10:00:00Z"
  }
]
```

### `POST /api/snippets/:id/shares`
Share with a registered user resolved by email or username. Body: `{ "recipient": "<email-or-username>" }` (validated: non-empty string, max 255).

- `201` share created → mapped share object (as above)
- `200` share already existed (idempotent re-share, no duplicate)
- `400` validation failure, or self-share attempt (`{ "error": "Cannot share a snippet with its owner" }` — acceptable to disclose, requester is the owner)
- `404 { "error": "Snippet or recipient not found" }` — covers snippet-not-owned AND recipient-not-registered with one indistinguishable shape (US13 scenario 6)

### `DELETE /api/snippets/:id/shares/:userId`
Revoke a recipient. Owner-only. `200` on delete, `404` if no such share/snippet ownership.

## Recipient side

### `GET /api/snippets/shared-with-me`
Snippets currently shared with `req.userId`, joined through `snippet_share`. Same snippet wire shape as `GET /api/snippets` plus owner identity:

```json
200: [
  {
    "id": 7,
    "title": "...",
    "description": "...",
    "code": "...",
    "language": "sql",
    "created_at": "...",
    "updated_at": "...",
    "owner": { "user_id": 1, "username": "zlatan", "display_name": null },
    "shared_at": "2026-07-07T10:00:00Z"
  }
]
```

Route-ordering note: must be registered before `GET /api/snippets/:id` so `shared-with-me` isn't captured as an `:id` param.

### `GET /api/snippets/:id` (existing, widened)
Read now allowed for owner **or** recipient (`canAccessSnippet`). Response includes `is_owner: boolean` so the client can render read-only mode. `PATCH`/`DELETE`/tags/collection/versions/shares remain owner-only → 404 for recipients.

## Comments (existing, access-scoped — closes the FR-012 defect)

### `GET /api/snippets/:snippetId/comments`
Now requires `canAccessSnippet`; 404 otherwise (previously: no check at all). Each comment gains author identity via a `users` join:

```json
200: [
  {
    "id": 5,
    "user_id": 3,
    "snippet_id": 7,
    "content": "...",
    "author_username": "mira",
    "author_display_name": "Mira K",
    "created_at": "...",
    "updated_at": "..."
  }
]
```

### `POST /api/snippets/:snippetId/comments`
Now requires `canAccessSnippet`; 404 otherwise (previously: only checked snippet existence). `201` returns the mapped comment including author identity.

### `PATCH /api/comments/:id` / `DELETE /api/comments/:id`
Unchanged: author-only via `comment.user_id = req.userId` in the `WHERE` clause. Revoked recipients keep authorship of past comments but can no longer reach them through the snippet (list/create rejected), while edit/delete of their own comment by ID still succeeds only for the author.

## Error conventions

- `401` unauthenticated (all endpoints)
- `400` express-validator failures: `{ "errors": [...] }`
- `404` used uniformly for not-found and not-authorized on owned resources (existing repo convention — no 403s that confirm existence)
- `500 { "error": "Internal server error" }`