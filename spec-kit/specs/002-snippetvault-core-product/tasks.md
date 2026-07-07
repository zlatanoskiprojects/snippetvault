# Tasks: SnippetVault Core Product

**Input**: Design documents from `spec-kit/specs/002-snippetvault-core-product/` (`spec.md`, `plan.md`)

**Tests**: No test suite exists in this repo yet. Verification below is manual, per each user story's Independent Test in `spec.md`.

**Organization**: Grouped by user story (US1–US12), matching spec.md's priorities. Each phase notes what's already built vs. net-new, based on a direct check of `backend/src/routes/` and `backend/src/db/schema.ts` — not assumed.

**Constitution**: Every task below must respect the ratified `.specify/memory/constitution.md` — in particular Principle I (ownership filtering by `req.userId` on every route), Principle II (camelCase↔snake_case translation via `mapX` helpers), Principle III (session-based auth only — no task here introduces JWT), and Principle IV (OWASP baseline: validators, parameterized queries, no secrets in responses).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US12 per spec.md

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

- [ ] T006 [US2] Add a shared `SUPPORTED_LANGUAGES` constant (single source of truth) consumed by both the backend validator and the frontend's language picker/`LanguageBadge`, per the earlier language-enum decision now confirmed by spec.md's FR-004.
- [ ] T007 [US2] Add `isIn(SUPPORTED_LANGUAGES)` to the `language` field validator in `backend/src/validators/snippets.ts` (both create and update chains), replacing the current free-text-only check.
- [ ] T008 🟢 [US2] Manual verification: existing ownership checks in `routes/snippets.ts` (`and(eq(snippet.id, id), eq(snippet.userId, req.userId))`) remain intact — regression check, not new code.
- [ ] T009 [US2] Manual verification: submitting a language not on the allowlist is rejected with a 400, not silently accepted (new behavior from T007).

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

## Phase 11: User Stories 10–12 - Version history, comments, AI settings *(built, not in formal requirements)* 🟢 built, needs a product decision

**Goal**: Not implementation work — these already function per spec.md's Scope Reconciliation. The only task is a decision, not code.

- [ ] T030 [US10/US11/US12] Get an explicit product decision: formalize version history, comments, and AI settings into the official requirements (promote out of "built but unofficial" status), keep them as-is without formalizing, or deprecate/remove any of them. No code should change here until that decision is made — do not implement or delete based on assumption.

**Checkpoint**: Decision recorded; only then does further work (if any) get scheduled as its own tasks.

---

## Phase 12: Non-Functional Requirements — cross-cutting

**Goal**: Address the NFRs from spec.md that aren't tied to a single user story.

- [ ] T031 [NFR-001/002] Load-test `GET /api/snippets` (list/search) against the 5,000-concurrent-user / 500ms and 50,000-record / 1s targets once US6 sorting (T019) lands — likely requires the DB indexes from spec-kit feature `001-owasp-security-hardening` (US2 of that spec) to be in place first; treat that feature as a dependency, not a duplicate.
- [ ] T032 [NFR-004] Confirm HTTPS/TLS termination is documented as a deployment requirement (likely handled by a reverse proxy/hosting platform, not application code) — not an application-layer task, but must not be silently unaddressed in deployment docs.
- [ ] T033 [NFR-005/008] Resolve the open SaaS-vs-self-hosted architecture question flagged in `plan.md` ("Target Users & Deployment Model") before implementing backup automation or health-check endpoints — this is a planning gap, not yet a coded task.
- [ ] T034 [NFR-009] Write self-hosted installation/integration documentation (expand `README.md`/`docker-compose.yml` usage instructions) once T033 is resolved.

**Checkpoint**: NFRs tracked explicitly rather than left implicit; several are blocked on architecture decisions, not code, and are flagged as such rather than estimated as if they were straightforward implementation tasks.

---

## Dependencies & Execution Order

- **US1, US3, US4, US8, US9** (Phases 2, 4, 5, 9, 10): verification-only, no dependencies, can run anytime, in parallel with everything else.
- **US2** (Phase 3): independent, only touches `validators/snippets.ts` + a new shared constants file + frontend language picker.
- **US5** (Phase 6): independent of US2/US6/US7 at the code level, but genuinely new — highest-effort phase after US7.
- **US6** (Phase 7): independent; T019's sort param can be built in parallel with US5.
- **US7** (Phase 8): independent of US2/US5/US6 at the code level; T025 (moderation) has a soft dependency on US5's T013/T014 existing first (moderation acts on the public-sharing mechanism).
- **US10–12** (Phase 11): blocked entirely on a product decision (T030), not code — do not schedule further work here until that's answered.
- **NFRs** (Phase 12): T031 depends on spec-kit feature `001-owasp-security-hardening`'s index work; T033/T034 are planning-level blockers before any code.

## Implementation Strategy

1. Run all verification-only phases (2, 4, 5, 9, 10) first — cheap, confirms nothing already-working is assumed broken.
2. Resolve T001/T002 (Setup) before starting US2/US7 respectively.
3. Ship US2 (language allowlist) — small, self-contained.
4. Ship US5 (public sharing) — the highest-value net-new capability per the product's own problem statement (controlled sharing is the differentiation), do this before US7.
5. Ship US6 (sorting) and US7 (admin) — can proceed in parallel given no shared files.
6. Resolve T030 (US10–12 product decision) whenever convenient — it's a decision, not scheduled dev time.
7. Address Phase 12 NFRs last, since several are blocked on other features/decisions rather than being independently implementable now.

## Notes

- 🟢-marked tasks intentionally produce no diff if verification passes — they exist so this task list doesn't silently imply everything in spec.md is unbuilt.
- 🔴/🟡-marked tasks are the actual net-new development surface: predominantly US5 (public sharing) and US7 (admin), which together account for most of the real implementation effort in this feature.
- `plan.md` for this feature still reflects the prior 10-user-story version of spec.md and has not yet been updated to include US5/US7/NFRs in its Project Structure and Per-Story Technical Notes sections — recommend regenerating or hand-updating `plan.md` before deep implementation of US5/US7, so the plan's file-level guidance matches these tasks.
