# Tasks: SnippetVault Core Product

**Input**: Design documents from `spec-kit/specs/002-snippetvault-core-product/` (`spec.md`, `plan.md`, `data-model.md`, `contracts/sharing-api.md`, `quickstart.md`)

**Tests**: No test suite exists in this repo yet. Verification below is manual, per each user story's Independent Test in `spec.md` and the scenarios in `quickstart.md`.

**Organization**: Grouped by user story (US1–US16), matching spec.md's priorities. Each phase notes what's already built vs. net-new, based on a direct check of `backend/src/routes/` and `backend/src/db/schema.ts` — not assumed. *(Updated 2026-07-07: US13 user-to-user sharing added, US11 comments formalized; second revision adds US14–US16 Team Workspaces as Phases 15–17.)*

**Constitution**: Every task below must respect the ratified `.specify/memory/constitution.md` — in particular Principle I (ownership filtering by `req.userId` on every route), Principle II (camelCase↔snake_case translation via `mapX` helpers), Principle III (session-based auth only — no task here introduces JWT), and Principle IV (OWASP baseline: validators, parameterized queries, no secrets in responses).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US16 per spec.md

## Status Legend

- 🟢 Already implemented — task is a verification/regression check, not new code
- 🟡 Partially implemented — schema/field exists, behavior/route does not
- 🔴 Not implemented — net-new work

---

## Phase 1: Setup

- [ ] T001 Confirm the predefined language allowlist's final value list (spec.md assumes JavaScript, Python, Java, C++, SQL, Go, Rust, TypeScript, "and can grow") before implementing US2's validator change.
- [ ] T002 Confirm whether "administrator" (US7) is a role assignable only via direct DB edit for now, or needs an admin-invites-admin / bootstrap-first-admin flow — spec.md doesn't specify how the first administrator account is created.

---

## Phase 2: User Story 1 - Registration, authentication, and roles (Priority: P1) 🟢 mostly built

**Goal**: Regression-verify existing auth; confirm role defaults correctly.

- [ ] T003 🟢 [US1] Manual verification: register a new account, confirm `role` defaults to `'user'` in the DB (`backend/src/db/schema.ts:18` already defaults this — verify no code path lets a client set `role` directly on registration).
- [ ] T004 🟢 [US1] Manual verification: full login/logout/session-persistence cycle still works as documented in `backend/src/routes/auth.ts`.
- [ ] T005 🟢 [US1] Confirm `POST /api/auth/register`/`login` validators reject malformed input before touching the DB (existing `express-validator` chains) — regression check only, no new code expected.

**Checkpoint**: No new work anticipated; flag here if verification finds a gap.

---

## Phase 3: User Story 2 - Snippet CRUD with predefined language (Priority: P1) 🟡 partial

**Goal**: Existing CRUD stays correct; add the predefined-language enforcement that's new in spec.md.

- [x] T006 [US2] Add a shared `SUPPORTED_LANGUAGES` constant (single source of truth) consumed by both the backend validator and the frontend's language picker/`LanguageBadge`, per the earlier language-enum decision now confirmed by spec.md's FR-004.
- [x] T007 [US2] Add `isIn(SUPPORTED_LANGUAGES)` to the `language` field validator in `backend/src/validators/snippets.ts` (both create and update chains), replacing the current free-text-only check.
- [ ] T008 🟢 [US2] Manual verification: existing ownership checks in `routes/snippets.ts` (`and(eq(snippet.id, id), eq(snippet.userId, req.userId))`) remain intact — regression check, not new code.
- [x] T009 [US2] Manual verification: submitting a language not on the allowlist is rejected with a 400, not silently accepted (new behavior from T007).

**Checkpoint**: Snippet CRUD enforces the predefined language list; all other CRUD behavior unchanged.

---

## Phase 4: User Story 3 - Collections (Priority: P2) 🟢 built

**Goal**: Regression-verify; no new work identified against spec.md's US3.

- [ ] T010 🟢 [US3] Manual verification: collection CRUD, snippet reassignment ownership check, and null-on-collection-delete cascade behavior all match `routes/collections.ts`/`routes/snippets.ts` as already implemented.

**Checkpoint**: No new work anticipated.

---

## Phase 5: User Story 4 - Global tags (Priority: P2) 🟢 built

**Goal**: Regression-verify; no new work identified against spec.md's US4.

- [ ] T011 🟢 [US4] Manual verification: tag reuse (not duplication) and detach-without-deleting-global-tag behavior match `routes/tags.ts` as already implemented.

**Checkpoint**: No new work anticipated.

---

## Phase 6: User Story 5 - Public sharing via unique links (Priority: P2) 🔴 not implemented

**Goal**: `snippet.shareToken` is currently write-never, read-only-if-present in API responses — no route generates it, no public route serves a snippet by it, no revoke logic exists. This phase builds all of it.

- [ ] T012 [US5] Add token-generation logic (e.g. `crypto.randomBytes` base64url-encoded) that fires when a snippet's `visibility` transitions to `public` via `PATCH /api/snippets/:id`, only if `shareToken` is currently null — reuse the existing token on repeated public/private/public toggles rather than rotating it, per spec.md Acceptance Scenario 1 ("if one doesn't already exist").
- [ ] T013 [US5] Add a new **unauthenticated** route, e.g. `GET /api/public/snippets/:shareToken`, that looks up a snippet by `shareToken` where `visibility = 'public'`, and returns only the public fields (title, description, code, language, tags) — explicitly excluding owner-only data (id ownership info, comments, versions) per spec.md US5 Acceptance Scenario 2. This route must NOT go through `authMiddleware`.
- [ ] T014 [US5] Ensure setting `visibility` back to `private` (existing `PATCH`) makes the public route (T013) stop resolving that snippet — either by checking `visibility` in the query (simplest) or by clearing `shareToken` (loses the link permanently on toggle back to public — confirm spec.md's intent: Acceptance Scenario 1 implies the token should be *reused* on re-publish, so prefer the visibility-check approach, not clearing the token).
- [ ] T015 [US5] Add a frontend view/route to render a public snippet by share token for unauthenticated visitors (currently no frontend page consumes `share_token` at all).
- [ ] T016 [US5] Add a "copy share link" affordance to `SnippetDetailPanel.tsx` when a snippet is public, surfacing the token-based URL.
- [ ] T017 [US5] Manual verification: publish a snippet, load its link unauthenticated, confirm content renders without exposing edit/delete affordances or owner-only data; revert to private, confirm the link no longer resolves; confirm two different snippets never collide on token.

**Checkpoint**: User Story 5 fully functional — this is the first genuinely new end-to-end feature in this task list.

---

## Phase 7: User Story 6 - Search and filtering with sorting (Priority: P2) 🟡 partial

**Goal**: Existing search/filter exists per CLAUDE.md's `GET /api/snippets` (assumed to support some filtering already) — spec.md adds an explicit sort requirement (creation date / last-modified / title) not previously verified.

- [ ] T018 [US6] Verify current `GET /api/snippets` implementation in `routes/snippets.ts` against spec.md FR-008: confirm keyword search covers title/description/code, confirm language/tag filter combination uses AND semantics.
- [ ] T019 [US6] Add a `sort` query parameter (`created_at` | `updated_at` | `title`, with a documented default) to `GET /api/snippets`, validated via `express-validator`'s `isIn`.
- [ ] T020 [US6] Manual verification: combined filters return AND-semantics results; sort parameter changes result order as expected; omitted sort falls back to the documented default.

**Checkpoint**: Search satisfies spec.md US6 including sorting, which is new relative to the prior spec version.

---

## Phase 8: User Story 7 - Administrator role and platform management (Priority: P3) 🔴 not implemented

**Goal**: `role` is stored and returned today but never checked or enforced anywhere in the backend — no admin routes exist. This phase builds the entire capability.

- [ ] T021 [US7] Add an `adminMiddleware` (or extend `authMiddleware`) that checks `req.userId`'s `role === 'admin'` and rejects (403) otherwise — mirrors the existing `authMiddleware` pattern in `middleware/authMiddleware.ts`.
- [ ] T022 [US7] Add `GET /api/admin/users` (list all users, admin-only) — new route file, e.g. `routes/admin.ts`.
- [ ] T023 [US7] Add `PATCH /api/admin/users/:id` (deactivate) and `DELETE /api/admin/users/:id` (full delete, cascading via existing FK constraints) — admin-only, must reject an admin deactivating/deleting their own account per spec.md's Edge Cases ("last remaining administrator" question raised in T002/spec.md Edge Cases — resolve before implementing the guard).
- [ ] T024 [US7] Add `GET /api/admin/stats` returning total user count, total snippet count, and a most-used-languages breakdown (a grouped count query over `snippet.language`).
- [ ] T025 [US7] Add snippet moderation: an admin-only action (e.g. `PATCH /api/admin/snippets/:id/moderate`) that forces a public snippet's visibility to private or otherwise invalidates its share link (integrates with T013/T014 from US5).
- [ ] T026 [US7] Add a minimal admin frontend surface (user list, stats view) — new page(s), gated on the logged-in user's `role`, but relying on T021's backend enforcement as the actual security boundary, not just hiding UI.
- [ ] T027 [US7] Manual verification: as a regular user, directly call each admin route (T022–T025) via curl/Postman bypassing the UI, confirm 403 on every one — this is the check that matters per spec.md Acceptance Scenario 5 ("route-level authorization, not just UI hiding").

**Checkpoint**: Administrator role is a real, enforced capability, not just a stored, inert field.

---

## Phase 9: User Story 8 - Profile and account lifecycle (Priority: P3) 🟢 built

**Goal**: Regression-verify; no new work identified against spec.md's US8.

- [ ] T028 🟢 [US8] Manual verification: profile edit, password change (current-password required), and account deletion cascade match `routes/profile.ts` as already implemented.

**Checkpoint**: No new work anticipated.

---

## Phase 10: User Story 9 - Landing page and dashboard (Priority: P4) 🟢 built

**Goal**: Regression-verify; no new work identified against spec.md's US9.

- [ ] T029 🟢 [US9] Manual verification: unauthenticated catch-all renders `LandingPage.tsx`; authenticated dashboard (`Dashboard.tsx`) shows a snippet/collection/activity summary as already implemented.

**Checkpoint**: No new work anticipated.

---

## Phase 11: User Stories 10 & 12 - Version history, AI settings *(built, not in formal requirements)* 🟢 built, needs a product decision

**Goal**: Not implementation work — these already function per spec.md's Scope Reconciliation. The only task is a decision, not code. *(US11 comments was removed from this decision bucket on 2026-07-07 — it is now formalized; its work is Phase 13 below.)*

- [ ] T030 [US10/US12] Get an explicit product decision: formalize version history and AI settings into the official requirements (promote out of "built but unofficial" status), keep them as-is without formalizing, or deprecate/remove either. No code should change here until that decision is made — do not implement or delete based on assumption.

**Checkpoint**: Decision recorded; only then does further work (if any) get scheduled as its own tasks.

---

## Phase 12: User Story 13 - Share a snippet with specific users (Priority: P3) 🔴 not implemented

**Goal**: Build user-to-user sharing end to end: `snippet_share` schema, owner-only share management, recipient read-only access, "shared with me" listing. Contract: `contracts/sharing-api.md`; schema: `data-model.md`. This phase is a prerequisite for Phase 13 (US11 comments scoping).

- [ ] T035 [US13] Add the `snippet_share` table to `backend/src/db/schema.ts` per `data-model.md` (`snippet_id` FK cascade, `user_id` recipient FK cascade, `permission` varchar default `'view'`, `created_at`, unique on the pair, indexes on both FKs) and generate the additive Drizzle migration under `backend/drizzle/`.
- [ ] T036 [US13] Create `backend/src/lib/snippetAccess.ts` exporting a `canAccessSnippet(snippetId, userId)` helper — owner OR active `snippet_share` row, single Drizzle query — the one access predicate shared by the snippet read path and comments (Phase 13), so the rule cannot drift between routes.
- [ ] T037 [P] [US13] Create `backend/src/validators/snippetShares.ts`: share-create chain (`recipient` non-empty string ≤255), snippet-id and recipient-user-id param validation.
- [ ] T038 [US13] Create `backend/src/routes/snippetShares.ts` per `contracts/sharing-api.md` — `GET`/`POST /api/snippets/:id/shares`, `DELETE /api/snippets/:id/shares/:userId`; owner-only via `WHERE` on `snippet.userId = req.userId`; recipient resolved by email or username; self-share rejected with 400; idempotent POST via `onConflictDoNothing` (201 created / 200 existing); unified `404 { "error": "Snippet or recipient not found" }` shape for not-owned and not-registered; snake_case `mapShare` with recipient identity join; mount the router in `backend/src/index.ts`.
- [ ] T039 [US13] Add `GET /api/snippets/shared-with-me` in `backend/src/routes/snippets.ts`, registered before the `/:id` route, joining `snippet_share` → `snippet` → owner `users` row for `req.userId`, returning the snippet wire shape plus `owner` identity and `shared_at`.
- [ ] T040 [US13] Widen `GET /api/snippets/:id` in `backend/src/routes/snippets.ts` to allow access via `canAccessSnippet` and add `is_owner` to the response; verify every mutation path (`PATCH`/`DELETE` snippet, tag attach/detach, collection reassignment, version restore/delete) remains strictly owner-scoped.
- [ ] T041 [P] [US13] Create `frontend/src/api/shares.ts` (list recipients, share, revoke, shared-with-me) with types added to `frontend/src/api/types.ts`, using `throwIfNotOk`/`ApiError` and `credentials: 'include'` per the existing API-module pattern.
- [ ] T042 [US13] Build `frontend/src/components/ShareDialog.tsx` (owner-only: recipient list, add by email/username, revoke) and wire a Share affordance into `frontend/src/pages/SnippetDetailPanel.tsx` — via the `frontend-ui-master` → `frontend-visual-tester` workflow per CLAUDE.md.
- [ ] T043 [US13] Build `frontend/src/pages/SharedWithMeView.tsx`, add its route in `frontend/src/App.tsx` and a "Shared with me" entry in `frontend/src/components/Sidebar.tsx` — via the `frontend-ui-master` → `frontend-visual-tester` workflow.
- [ ] T044 [US13] Render `frontend/src/pages/SnippetDetailPanel.tsx` in read-only mode when `is_owner` is false (no edit/delete/tag/collection/share affordances) — via the `frontend-ui-master` → `frontend-visual-tester` workflow.
- [ ] T045 [US13] Manual verification per `quickstart.md` Scenarios 1, 3, 4, and 5 (share/read/deny, revocation, enumeration/self-share, cascades).

**Checkpoint**: A recipient can find, open, and read a shared snippet but mutate nothing; the owner controls the recipient list; revocation and deletion leave no residual access or orphaned rows.

---

## Phase 13: User Story 11 - Comments scoped to owner + share recipients (Priority: P3) 🟡 partial — CRUD built, access rule and author identity missing

**Goal**: Close the recorded FR-012 defect (comments `GET`/`POST` perform no snippet-access check today) and surface author identity, per spec.md US11 and `contracts/sharing-api.md`. Depends on Phase 12 (T036's predicate).

- [ ] T046 [US11] Gate `GET` and `POST /api/snippets/:snippetId/comments` in `backend/src/routes/comments.ts` behind `canAccessSnippet` (404 otherwise), replacing the current existence-only check on POST and the missing check on GET; keep `PATCH`/`DELETE /api/comments/:id` author-only as implemented.
- [ ] T047 [US11] Join `users` in the comments queries and extend `mapComment` to include `author_username`/`author_display_name` (single joined query, no N+1), on both the list response and the created-comment response.
- [ ] T048 [P] [US11] Update `frontend/src/api/comments.ts` types for the author fields and render author identity (display name falling back to username) in the comments UI in `frontend/src/pages/SnippetDetailPanel.tsx`, with the composer available to recipients in read-only snippet mode — via the `frontend-ui-master` → `frontend-visual-tester` workflow.
- [ ] T049 [US11] Manual verification per `quickstart.md` Scenario 2, plus Scenario 3 step 3 (revoked recipient's past comments remain visible to the owner, with authorship).

**Checkpoint**: SC-008 holds — no authenticated user can read or post comments on a snippet they neither own nor were granted; comments show who wrote them.

---

## Phase 14: Non-Functional Requirements — cross-cutting

**Goal**: Address the NFRs from spec.md that aren't tied to a single user story.

- [ ] T031 [NFR-001/002] Load-test `GET /api/snippets` (list/search) against the 5,000-concurrent-user / 500ms and 50,000-record / 1s targets once US6 sorting (T019) lands — likely requires the DB indexes from spec-kit feature `001-owasp-security-hardening` (US2 of that spec) to be in place first; treat that feature as a dependency, not a duplicate.
- [ ] T032 [NFR-004] Confirm HTTPS/TLS termination is documented as a deployment requirement (likely handled by a reverse proxy/hosting platform, not application code) — not an application-layer task, but must not be silently unaddressed in deployment docs.
- [ ] T033 [NFR-005/008] Resolve the open SaaS-vs-self-hosted architecture question flagged in `plan.md` ("Target Users & Deployment Model") before implementing backup automation or health-check endpoints — this is a planning gap, not yet a coded task.
- [ ] T034 [NFR-009] Write self-hosted installation/integration documentation (expand `README.md`/`docker-compose.yml` usage instructions) once T033 is resolved.

**Checkpoint**: NFRs tracked explicitly rather than left implicit; several are blocked on architecture decisions, not code, and are flagged as such rather than estimated as if they were straightforward implementation tasks.

---

## Phase 15: User Story 14 - Workspace creation and membership management (Priority: P2) 🔴 not implemented

**Goal**: The workspace container: `workspace` + `workspace_membership` tables, role helpers, lifecycle and membership routes. Contract: `contracts/workspace-api.md`; DDL: `data-model.md`. Prerequisite for Phases 16–17.

- [ ] T050 [US14] Add `workspace` and `workspaceMembership` tables to `backend/src/db/schema.ts` per `data-model.md` (unique slug; membership unique on the pair, `role` default `'member'`, both FKs cascade, indexes on both FKs) and generate the additive Drizzle migration under `backend/drizzle/`.
- [ ] T051 [US14] Create `backend/src/lib/workspaceAccess.ts`: `getMembership(workspaceId, userId)` and a `requireRole(workspaceId, userId, roles)` guard — per-request lookups, no session caching, single Drizzle query each.
- [ ] T052 [P] [US14] Create `backend/src/validators/workspaces.ts`: workspace create/rename chains (name 1–100 chars), member-invite chain (`recipient` ≤255, `role` isIn admin/member), role-change and transfer chains, id param validation.
- [ ] T053 [US14] Create `backend/src/routes/workspaces.ts` per `contracts/workspace-api.md`: `GET`/`POST /api/workspaces`, `GET`/`PATCH`/`DELETE /api/workspaces/:id`, `POST /api/workspaces/:id/members`, `PATCH`/`DELETE /api/workspaces/:id/members/:userId`, `POST /api/workspaces/:id/transfer` — creation inserts the creator's `owner` membership in one transaction; transfer demotes-then-promotes atomically; owner leave/removal rejected with `400`; invite is idempotent with the unified `404 { "error": "Workspace or recipient not found" }` anti-enumeration shape; snake_case `mapWorkspace`/`mapMembership` helpers; mount in `backend/src/index.ts`.
- [ ] T054 [US14] Block account deletion in `backend/src/routes/profile.ts` while the user holds an `owner` membership (reject with `400` transfer-or-delete-first), per spec.md Edge Cases.
- [ ] T055 [P] [US14] Create `frontend/src/api/workspaces.ts` (list/create/get/rename/delete, invite/change-role/remove/leave, transfer) with types in `frontend/src/api/types.ts`, following the existing API-module pattern.
- [ ] T056 [US14] Build `frontend/src/components/WorkspaceDialog.tsx` (create, invite, role change, transfer, delete via `AlertDialog`) and a workspace list/members panel entry point — via the `frontend-ui-master` → `frontend-visual-tester` workflow.
- [ ] T057 [US14] Manual verification per `quickstart.md` Scenario 6 (lifecycle, idempotent invite, admin limits, transfer, owner-account-deletion block).

**Checkpoint**: Workspaces exist with exactly one Owner each; membership and roles are manageable and enforced; no content is scoped to them yet.

---

## Phase 16: User Story 15 - Workspace snippet lifecycle and team collections (Priority: P2) 🔴 not implemented

**Goal**: Dual-scope content: `workspace_id` on snippet/collection, same-scope collection rule, member-visible listings, scope-aware search. Depends on Phase 15 (T050–T051).

- [ ] T058 [US15] Add nullable `workspace_id` FK (cascade) to `snippet` and `collection` in `backend/src/db/schema.ts` with indexes per `data-model.md`; generate the additive Drizzle migration (no backfill — NULL = personal).
- [ ] T059 [US15] Extend `POST /api/snippets` and `POST /api/collections` to accept optional `workspace_id`, verifying active membership via `getMembership` before insert (404 otherwise), in `backend/src/routes/snippets.ts` and `backend/src/routes/collections.ts`.
- [ ] T060 [US15] Extend the collection-assignment check in `PATCH /api/snippets/:id` (`backend/src/routes/snippets.ts`) to the same-scope rule: workspace snippets only into same-workspace collections, personal snippets only into requester-owned personal collections; cross-scope → `400`.
- [ ] T061 [US15] Add member-only `GET /api/workspaces/:id/snippets` and `GET /api/workspaces/:id/collections` (creator identity joined, existing search/filter/sort params honored) in `backend/src/routes/workspaces.ts`.
- [ ] T062 [US15] Scope personal listings: ensure `GET /api/snippets` and `GET /api/collections` exclude workspace-scoped rows (`workspace_id IS NULL`) unless a combined-scope parameter is passed; tag filtering composes with the scope selector.
- [ ] T063 [P] [US15] Build `frontend/src/components/ScopeSwitcher.tsx` (personal / workspace / combined) in `frontend/src/components/Sidebar.tsx` and `frontend/src/pages/WorkspaceView.tsx` (workspace snippet/collection listing + members panel) with route in `frontend/src/App.tsx` — via the `frontend-ui-master` → `frontend-visual-tester` workflow.
- [ ] T064 [US15] Manual verification per `quickstart.md` Scenario 7 (member visibility, same-scope rule, uncategorize-on-delete, global tag reuse, non-member denial, no cross-scope leakage).

**Checkpoint**: Workspace content is real and isolated; personal views stay personal; collections respect scope.

---

## Phase 17: User Story 16 - Workspace role enforcement and comments (Priority: P2) 🔴 not implemented

**Goal**: Role-governed writes, comments open to members, per-request eviction, scope moves. Depends on Phases 15–16.

- [ ] T065 [US16] Widen `canAccessSnippet` in `backend/src/lib/snippetAccess.ts` to owner OR active share OR active workspace membership, and add `canEditSnippet` (personal: owner; workspace: creator or admin/owner role) per `data-model.md` access rules.
- [ ] T066 [US16] Switch snippet mutations in `backend/src/routes/snippets.ts` (PATCH, DELETE, version restore/delete) and tag attach/detach in `backend/src/routes/tags.ts` from owner-only `WHERE` clauses to `canEditSnippet`; reads return `can_edit` alongside `is_owner`.
- [ ] T067 [US16] Verify `backend/src/routes/comments.ts` needs no route change — workspace comment access must fall out of T065's widened `canAccessSnippet` (list/create open to members automatically, author-only edit/delete unchanged); adjust only if the predicate isn't already the sole gate.
- [ ] T068 [US16] Add `POST /api/snippets/:id/move` in `backend/src/routes/snippets.ts` per `contracts/workspace-api.md` (FR-020): personal→workspace (owner + member of target; strips `collection_id`, deletes `snippet_share` rows, one transaction) and workspace→personal (creator/admin/owner → mover's personal scope, strips `collection_id`); also reject sharing workspace snippets in `backend/src/routes/snippetShares.ts`.
- [ ] T069 [P] [US16] Frontend role-gating: `frontend/src/pages/SnippetDetailPanel.tsx` drives edit/delete/tag/collection affordances off `can_edit`, keeps the comment composer for all members, and adds the move-scope action; `frontend/src/api/snippets.ts`/`types.ts` updated for `can_edit` and move — via the `frontend-ui-master` → `frontend-visual-tester` workflow.
- [ ] T070 [US16] Manual verification per `quickstart.md` Scenarios 8 and 9 (role matrix, member comments, mid-session eviction, no platform-admin bypass, moves, cascade delete SC-011).

**Checkpoint**: SC-009/SC-010/SC-011 hold — the workspace is an enforced access-control perimeter, not a label.

---

## Dependencies & Execution Order

- **US1, US3, US4, US8, US9** (Phases 2, 4, 5, 9, 10): verification-only, no dependencies, can run anytime, in parallel with everything else.
- **US2** (Phase 3): independent, only touches `validators/snippets.ts` + a new shared constants file + frontend language picker.
- **US5** (Phase 6): independent of US2/US6/US7 at the code level, but genuinely new — highest-effort phase after US7.
- **US6** (Phase 7): independent; T019's sort param can be built in parallel with US5.
- **US7** (Phase 8): independent of US2/US5/US6 at the code level; T025 (moderation) has a soft dependency on US5's T013/T014 existing first (moderation acts on the public-sharing mechanism).
- **US10 & US12** (Phase 11): blocked entirely on a product decision (T030), not code — do not schedule further work here until that's answered.
- **US13** (Phase 12): independent of US2/US5/US6/US7 at the code level (new table, new route file, one widened read path). Backend chain is strictly ordered: T035 (schema) → T036 (predicate) → T038/T039/T040; T037 and T041 are parallelizable [P]; frontend T042–T044 depend on T038–T041.
- **US11** (Phase 13): depends on Phase 12's T035+T036 (the predicate needs `snippet_share` to exist). T046/T047 are one route-file change; T048 is parallelizable against T047 once the wire shape in `contracts/sharing-api.md` is treated as fixed.
- **US5 vs US13**: no shared code path (anonymous token read vs. authenticated share grants) — can be built in either order or in parallel.
- **NFRs** (Phase 14): T031 depends on spec-kit feature `001-owasp-security-hardening`'s index work; T033/T034 are planning-level blockers before any code.
- **US14** (Phase 15): depends on nothing new (fresh tables/routes). Chain: T050 → T051 → T053/T054; T052 and T055 are [P]; frontend T056 last.
- **US15** (Phase 16): depends on Phase 15's T050–T051. Chain: T058 → T059/T060/T061/T062; T063 [P] against backend once contracts are fixed.
- **US16** (Phase 17): depends on Phases 15–16 **and** on US13's Phase 12 (T036's `canAccessSnippet` is the file being widened, T068 touches `snippetShares.ts`). Build US13 before US16, or accept implementing the predicate workspace-aware from the start.
- **US13 vs workspaces**: shares are personal-only per FR-020 — T068 adds the workspace-snippet rejection to the share POST built in T038.

## Implementation Strategy

1. Run all verification-only phases (2, 4, 5, 9, 10) first — cheap, confirms nothing already-working is assumed broken.
2. Resolve T001/T002 (Setup) before starting US2/US7 respectively.
3. Ship US2 (language allowlist) — small, self-contained.
4. Ship US13 + US11 (Phases 12–13) as one arc: sharing's backend (T035–T040), then the comments fix (T046–T047) — this closes the live FR-012 access-control defect in comments, which is the most security-relevant open item — then the frontend tasks (T041–T044, T048).
5. Ship US14 → US15 → US16 (Phases 15–17) in order, after US13 — the workspace layer builds directly on the sharing arc's access predicate, and spec priority (P2) puts it ahead of the remaining P3 work.
6. Ship US5 (public sharing) — high-value and independent of both sharing arcs; parallelize with steps 4–5 if capacity allows.
7. Ship US6 (sorting) and US7 (admin) — can proceed in parallel given no shared files.
8. Resolve T030 (US10/US12 product decision) whenever convenient — it's a decision, not scheduled dev time.
9. Address Phase 14 NFRs last, since several are blocked on other features/decisions rather than being independently implementable now.

## Notes

- 🟢-marked tasks intentionally produce no diff if verification passes — they exist so this task list doesn't silently imply everything in spec.md is unbuilt.
- 🔴/🟡-marked tasks are the actual net-new development surface: US5 (public sharing), US7 (admin), US13+US11 (user-to-user sharing + comments scoping), and US14–US16 (Team Workspaces — the largest single addition), which together account for the real implementation effort in this feature.
- The comments access-control gap fixed by T046 is a **live defect today** (any authenticated user can read/post comments on any snippet by ID) — if Phase 12/13 scheduling slips, T035+T036+T046 alone form a minimal security fix worth shipping early.
- `plan.md`, `data-model.md`, `contracts/sharing-api.md`, and `quickstart.md` were updated/created 2026-07-07 and are in sync with this task list and spec.md's 13-story version.
