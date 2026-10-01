# Projects and Workspace Feature Plan

## Current status and next task

Workspace authorization, workspace member management, normalized resource parameters, and workspace-aware project/snippet/tag/version/comment routes are implemented. Project assignment reads and writes `snippet_project`, and every snippet now requires a workspace. An owner-only workspace is the private single-user case. The unused legacy project-member routes, validators, membership helper, and invitation stub are removed from application code; legacy project membership tables remain in the schema for a later migration.

The workspace switcher uses authenticated workspace data, supports workspace creation, and selects only real workspaces. The Members view loads actual members and roles. Invitation actions remain unavailable.

The frontend API modules, types, hooks, workspace selection, members view, and permission-aware controls now use the workspace-only resource URLs. Backend/frontend typechecks and builds, frontend lint, and the workspace-only invariant tests pass. Migrations `0008_require_snippet_workspace` and `0009_drop_legacy_project_membership` were applied locally on 2026-09-20. Verification found 15 snippets, zero null workspace IDs, zero cross-workspace assignments, zero users without a workspace, and zero ownerless workspaces. Legacy project memberships had exact workspace equivalents, no legacy invitations existed, and `project_member`, `project_invitation`, and `project_role` are now removed. Workspace invitation APIs remain a separate follow-up phase.

After the frontend works against the new API and end-to-end owner/editor/viewer/non-member checks pass, verify that every legacy project membership and invitation row is either represented by the workspace model or deliberately migrated. Only then remove `project_member`, `project_invitation`, and `project_role` through a new forward Drizzle migration.

Schema definitions were updated on 2026-09-18. Migration `0007_workspaces.sql` and its snapshot/journal metadata were generated and applied to the existing local development database on 2026-09-18. The SQL backfilled one workspace per existing project, copied memberships and snippet assignments, then applied required columns before dropping snippet.project_id. Read-only database checks verified all four workspace CASCADE foreign keys, matching snippet/project workspaces, copied memberships, and one owner per migrated workspace. Custom workspace CHECK constraints and all new triggers were removed at the user's request; foreign keys, primary keys, unique indexes, and enum values remain. Workspace business rules are now enforced by the backend routes and permission middleware.

Checked workspace items below mean schema definitions, migration-file preparation, implemented route code, or completed verification as explicitly stated. The workspace router is mounted, the local migration is applied, and live backend authorization checks have passed.

## Progress checkpoint (2026-09-20)

- [x] Define workspace, workspace_member, and workspace_invitation tables.
- [x] Define required workspace ownership for projects and snippets.
- [x] Normalize optional project assignment into snippet_project, with at most one project per snippet.
- [x] Define primary keys, foreign keys, NOT NULL requirements, uniqueness, enums, and lookup indexes.
- [x] Generate migration 0007_workspaces and matching snapshot/journal metadata.
- [x] Add migration backfill preserving existing projects, memberships, and snippet project assignments; retain the one-time owner preflight check.
- [x] Remove custom workspace CHECK constraints and all new triggers as requested; update snapshot and schema checks accordingly.
- [x] Pass the isolated schema typecheck, runnable schema-metadata check, and whitespace verification after removing custom constraints.
- [x] Apply the migration to the existing local development database and verify workspace relationships, copied memberships, owner counts, and cascade settings.
- [x] Implement workspace list/create/rename route handlers and getWorkspaceMembership.
- [x] Define workspace and member validators; wire creation/rename validation and owner-scoped rename.
- [x] Mount the workspace router at /api/workspaces.
- [x] Perform 55 live authenticated endpoint checks after adapting legacy resource routes.
- [x] Implement workspace member management and adapt resource authorization/business-rule checks.
- [x] Restore the full backend typecheck/build after adapting legacy routes.
- [x] Connect and statically verify the frontend against the workspace-only API design.
- [ ] Implement workspace invitation actions in their separate phase.
- [x] Account for legacy data and drop `project_member`, `project_invitation`, and `project_role` through migration `0009_drop_legacy_project_membership`.

Schema definitions, migration-file preparation, workspace APIs, member APIs, reusable permission middleware, resource route migration, and live backend verification are complete. Same-workspace assignment and owner protection are enforced in the backend. Invitation business rules remain pending. The database's partial unique index retains the at-most-one-owner rule.

## Agreed behavior and boundaries

- Projects belong to exactly one workspace. Switching workspaces changes the projects shown and the workspace used for new projects.
- Every snippet belongs to one workspace. A workspace with only its owner is the private single-user case.
- Workspace snippets can optionally belong to a project in that same workspace.
- Workspace membership grants access to all projects and unassigned snippets in that workspace. There are no separate project memberships.
- A workspace with only its owner is personal to that owner; inviting members shares access. Workspace membership does not make snippets publicly shared.
- Keep `owner`, `editor`, and `viewer` roles. Owners and editors may create projects; only owners rename/delete projects and manage workspace members. Owners and editors manage snippets and move/unassign them between projects within the same workspace.
- The latest requirement is strict 3NF for the workspace model, superseding the earlier two-FK project-assignment approach. Store workspace IDs on projects and snippets; move optional project assignment to `snippet_project(snippet_id PRIMARY KEY, project_id)`. Do not also store project_id on snippet or workspace_id on the assignment table.
- The frontend always selects a real workspace; there is no separate Personal scope.
- Scope includes backend authorization and frontend connection. Invitations follow as a separate phase.
- Workspace deletion is included: only the owner may delete; cascade workspace members, invitations, projects, snippets, assignments, comments, and versions. Preserve user accounts, other workspaces, and global tag definitions. Defer ownership transfer and moving resources between workspaces.
- No data reset or deployment is included. Existing test data may be expendable, but the exact reset scope was not confirmed; preserve it by default.

## Target database model

| Table | Fields and relationships |
|---|---|
| `workspace` | `id`, `name`, `created_at` |
| `workspace_member` | `workspace_id`, `user_id`, `role`, `joined_at`; composite primary key on workspace/user |
| `project` | Required `workspace_id`; existing fields retained |
| `snippet` | Required `workspace_id`; retain `user_id` for creator attribution; no stored `project_id` |
| `snippet_project` | `snippet_id` primary key/FK and required `project_id` FK; at most one project per snippet |
| `workspace_invitation` (schema added; API later) | `workspace_id`, `invited_user_id`, `invited_by_user_id`, `role`, `created_at`, `expires_at` |

| Snippet state | `workspace_id` | `snippet_project` assignment | Authenticated access |
|---|---|---|---|
| Workspace, no project | Workspace ID | None | Workspace members |
| Workspace, in project | Workspace ID | Project ID | Workspace members |

Existing `user_id` fields record creator attribution and never bypass workspace membership authorization.

## Phase 1: Workspace schema and data migration

- [x] Add `workspace` and `workspace_member` to the authoritative Drizzle schema.
- [x] Add the workspace role enum.
- [ ] Migrate legacy roles and remove the project role enum after legacy tables are removed.
- [x] Add required `project.workspace_id` and `snippet.workspace_id`.
- [x] Define normalized `snippet_project` assignment and remove `snippet.project_id` from the target schema.
- [x] Define foreign keys and indexes on workspace references, membership user IDs, creator user IDs, and `snippet_project.project_id`.
- [x] Enforce matching snippet/project workspaces in transactional backend assignment logic. Do not add custom database CHECK constraints or triggers; reject workspace moves in the backend.
- [x] Define cascading deletion of assignment rows when a project is deleted; the snippets themselves and their workspace IDs remain unchanged.
- [x] Define a partial unique index allowing at most one workspace owner.
- [x] Implement creation and member-management rules to preserve the presence of that owner.
- [x] Generate new forward migration `0007_workspaces` with snapshot and journal metadata.
- [x] Complete migration SQL with data-preserving workspace/membership/assignment backfill.
- [x] Apply migration 0007_workspaces locally; preserve applied migration history. Future schema changes require a new forward migration.
- [x] Implement migration SQL to create one workspace per existing project and copy memberships/roles; abort on invalid existing ownership.
- [x] Verify copied legacy memberships and roles match the workspace memberships in the application database.
- [x] Implement migration SQL to copy existing snippet.project_id values into snippet_project and populate assigned snippet workspace IDs before dropping the old column.
- [x] Add forward migration `0008_require_snippet_workspace` to place remaining null-scoped snippets in owner-only workspaces and make `snippet.workspace_id` required.
- [x] Verify assigned snippets match their projects' workspace IDs after migration and complete live workspace access checks.
- [ ] Verify content and membership counts, workspace/project consistency, and ownership before removing old tables.
- [ ] Keep creator attribution separate from permissions; review existing creator foreign-key deletion behavior so deleting a creator cannot unexpectedly remove shared content or orphan workspace ownership.
- [ ] Use the existing local `snippetvault-db-1` container and preserve its volume and private environment configuration.

## Phase 2: Workspace APIs and member management

- [x] Implement and live-verify GET /api/workspaces returning only the caller's workspaces with their role.
- [x] Implement and live-verify POST /api/workspaces creating the workspace and owner membership in one transaction.
- [x] Implement owner-only PATCH /api/workspaces/:workspaceId for renaming, with validation, 404/403 handling, an owner-membership WHERE condition, and empty-result handling.
- [x] Mount the exported workspace router under /api/workspaces in index.ts after normal JSON/auth middleware ordering.
- [x] Implement owner-only DELETE /api/workspaces/:workspaceId with validation, owner-scoped SQL, and missing-resource handling.
- [x] Define cascading deletion for all four workspace foreign keys in schema, pending migration SQL, and snapshot.
- [x] Live-verify workspace GET/POST/PATCH/DELETE after adapting legacy routes, including disposable fixture cleanup.
- [x] Add GET /api/workspaces/:workspaceId/members with workspace membership authorization.
- [x] Add PATCH /api/workspaces/:workspaceId/members/:userId with owner-only role changes and owner protection.
- [x] Add DELETE /api/workspaces/:workspaceId/members/:userId with owner-only removal and owner protection.
- [x] Retire project member endpoints after adding workspace replacements.
- [x] Allow all workspace members to read the member list; restrict role changes and removal to the owner.
- [x] Accept only editor/viewer role changes and prevent changing or removing the owner, including concurrent attempts.
- [x] Define validation chains for workspace/member IDs, workspace creation/rename, and editor/viewer role changes.
- [x] Run validationResult before database access in existing workspace POST/PATCH handlers.
- [x] Wire validators and validationResult into member-management handlers before authorization queries.
- [x] Return snake_case fields in existing workspace responses.
- [x] Exclude private account fields from the member-list response.
- [x] Add shared getWorkspaceMembership(workspaceId, userId) using both IDs and returning role or null.

## Phase 3: Adapt backend authorization

| Action | Owner | Editor | Viewer |
|---|---|---|---|
| Read workspace projects, snippets, versions, tags assigned to snippets, and comments | Yes | Yes | Yes |
| Create/edit/delete workspace snippets and manage versions/tag assignments | Yes | Yes | No |
| Assign/move/unassign snippets within the workspace | Yes | Yes | No |
| Create comments and edit/delete own comments | Yes | Yes | Yes |
| Create projects | Yes | Yes | No |
| Rename/delete projects | Yes | No | No |
| Rename workspace and manage members | Yes | No | No |

- [x] Replace project membership authorization across projects, snippets, versions, tag-filtered snippet reads, tag assignments, and comments.
- [x] Remove personal-snippet authorization branches; all snippet access uses workspace membership.
- [x] Authorize projects through their stored workspace IDs; creating a project does not create new membership.
- [x] Require `workspace_id` for project listing and creation; verify membership and role server-side.
- [x] Scope snippet list/search and tag-filtered snippet lists through nested workspace routes only.
- [x] Require nested workspace snippet creation; requests optionally accept `project_id` from the same workspace.
- [x] Read project assignments through snippet_project joins and preserve project_id in the API wire format; insert/update/delete assignment rows transactionally with snippet mutations.
- [x] Validate project assignments against the snippet's workspace, regardless of membership in other workspaces.
- [x] Resolve authorization for ID-based resources from stored workspace IDs, never a caller-supplied workspace alone.
- [x] Return `404` to non-members and `403` to members lacking the required role.
- [x] Add membership and allowed-role predicates to project, workspace, snippet, and version mutation WHERE clauses.
- [x] Scope list/search queries directly without N+1 membership lookups.
- [x] Remove creator-ownership fallbacks for workspace resources, including content created by members later removed.
- [x] Retain comment authorship requirements in addition to workspace permission checks.
- [x] Permit owners/editors to move or unassign snippets within their workspace; remove the old owner-only project-exit restriction.
- [x] Reject changing workspace IDs through ordinary PATCH requests; resource workspace moves are deferred.
- [x] Preserve public-share behavior and prevent public responses from leaking workspace/member/private account details.
- [x] Preserve authentication handler ordering, CORS restrictions, session behavior, parameterized queries, and encrypted AI settings.

## Phase 4: Frontend workspace connection

- [x] Update frontend API modules to use `/api/workspaces/:workspaceId/projects`, `/api/workspaces/:workspaceId/snippets`, `/api/projects/:projectId`, `/api/snippets/:snippetId`, and nested snippet comment/version/tag routes.
- [x] Add workspace API functions and shared Workspace/WorkspaceMember/WorkspaceRole types; include `workspace_id` and applicable role fields in project/snippet responses and types.
- [x] Wire AI settings to the singleton endpoint `GET|PUT|DELETE /api/ai-settings`.
- [x] Replace placeholder workspace options with the authenticated workspace list and select a real workspace.
- [x] Connect Add workspace to workspace creation and select the successfully created workspace.
- [x] Fetch projects for the selected workspace.
- [x] Scope snippets, search, project dropdowns, project counts, and tag-filtered content to the selected workspace.
- [x] Include the selected workspace ID when creating workspace projects or snippets.
- [x] Clear active projects, selected snippet details, edit forms, and search state on workspace changes; ignore stale responses from the previous selection.
- [ ] After workspace deletion, remove it from the switcher, clear its projects/snippets/member list/invitations, and select another available workspace. Refresh and clear stale workspace data on a 404 for members whose workspace was deleted by its owner.
- [x] Load real members for the selected workspace and show actual roles rather than a hardcoded Owner badge.
- [x] Hide workspace/project management controls from non-owners and snippet mutation controls from viewers; retain server enforcement.
- [ ] Display permission errors and handle revoked workspace access by clearing stale data and refreshing workspace options.
- [x] Keep invitations unavailable until Phase 6 is implemented.
- [x] Delegate component/JSX/Tailwind changes to frontend-ui-master under the repository workflow; browser/visual testing requires an explicit user request.

## Phase 5: Cleanup and workspace verification

- [x] Remove project membership routes, validators, helper, and all application references after adding workspace replacements.
- [x] Remove the obsolete unmounted project invitation route stub.
- [ ] Complete the frontend workspace/API migration and pass end-to-end UI/API checks before changing legacy database tables.
- [x] Confirm no backend or frontend application code reads or writes `project_member`, `project_invitation`, or `project_role`.
- [x] Compare all 3 legacy project memberships with `workspace_member`; all roles and workspace mappings matched.
- [x] Inspect existing `project_invitation` rows; none existed and no invitation state required migration.
- [x] Remove `projectMember`, `projectInvitation`, and `projectRole` from the authoritative Drizzle schema after the data checks passed.
- [x] Generate and review forward migration `0009_drop_legacy_project_membership` without editing applied migration `0007_workspaces`.
- [x] Apply the cleanup migration locally and rerun schema typecheck, build, and workspace-only invariant tests.
- [x] Verify the cleanup migration preserves workspaces, workspace memberships/invitations, projects, snippets, assignments, comments, versions, tags, and users with their pre-drop counts.
- [x] Replace historical project-authorization regression checks with runnable workspace checks.
- [x] Remove the personal-snippet route and authorization model.
- [x] Add isolated owner/editor/viewer/non-member authorization middleware checks.
- [x] Verify permission maps allow owners/editors to move snippets while editors cannot manage projects or members.
- [x] Add route-level cross-workspace, unchanged, denied, and allowed project-assignment checks.
- [ ] Test removed creators, successful member removal, and demotion; access must reflect current membership on subsequent requests.
- [x] Live-test protected owner management, comment authorship, invalid IDs/bodies, snake_case responses, and denied writes.
- [ ] Verify public sharing still works independently of workspace membership and does not grant comment access.
- [ ] Verify migration counts and existing access; deleting a project must remove assignment rows while retaining snippets in their workspace.
- [x] Add a runnable test for required snippet workspace scope and migration backfill: `cd backend && pnpm build && pnpm exec vitest run test/workspaceOnly.test.mjs`.
- [ ] Verify backend validation rejects cross-workspace assignments, workspace moves, owner removal/demotion, invalid invitation roles/expiry, and invitations for existing members, including concurrency.
- [x] Verify workspace switching clears stale selections and older requests cannot replace the selected workspace's content through source review and request guards.
- [x] Run backend typecheck, build, and backend authorization/validation tests after route migration.
- [x] Run frontend typecheck/lint/build after updating deferred frontend callers.
- [x] Run backend-only authenticated HTTP checks against native dev servers with disposable fixtures and remove all recorded fixtures afterward.
- [ ] Rerun authenticated end-to-end API/UI checks after frontend wiring and before dropping legacy tables.
- [ ] When explicitly requested, verify workspace/project/member/viewer screens across desktop/mobile breakpoints.

## Phase 6: Workspace invitations (follow-up)

The old project invitation roadmap is superseded by workspace invitations.

- [x] Define `workspace_invitation` with workspace/recipient uniqueness, inviter attribution, role enum, timestamps, expiry, and lookup indexes; editor/viewer-only invitation roles and valid expiry must be validated in the backend.
- [x] Apply the invitation table through migration 0007_workspaces locally.
- [ ] Define invitation expiry duration and expired-invitation replacement behavior before implementing this phase.
- [ ] Add owner-only `POST /api/workspaces/:workspaceId/invitations` with normalized-email lookup of existing accounts.
- [ ] Reject existing members and duplicate active invitations; rate-limit creation.
- [ ] Add `GET /api/invitations` for the signed-in recipient, including workspace, inviter, role, and expiry information.
- [ ] Add recipient-only accept and decline actions and owner-only cancellation of pending workspace invitations.
- [ ] Accept transactionally by consuming the invitation and inserting workspace membership; expiry and duplicate/concurrent acceptance must not create inconsistent membership.
- [ ] Connect invite-by-email, role selection, Invitations listing, Accept/Decline, and cancellation to the API.
- [ ] Invitations may be received by existing accounts only in the initial implementation; defer signup-token/email-delivery flows.
- [ ] Test recipient/owner authorization, expiry, removed inviters, membership changes, duplicate creation, and simultaneous acceptance.

## Historical project implementation

These completed items describe the previous project-scoped implementation. They are preserved for context and do not mark the workspace replacement complete. The previous next task of implementing project invitations is superseded.

- [x] Renamed Collections to Projects in frontend/backend and moved the API to `/api/projects`.
- [x] Changed snippets to use `project_id`.
- [x] Added project membership/invitation tables, constraints, and lookup indexes.
- [x] Generated and applied migration `0006_projects` locally, preserving existing projects and snippets.
- [x] Backfilled owner memberships and created new project/owner membership transactionally.

### Previous project membership authorization

Complete: authorization regressions and live checks passed on 2026-09-17.

- [x] Add one shared membership lookup for `projectId` and `userId`.
- [x] List every project where the current user is a member.
- [x] Include the current user's role in project responses.
- [x] Restrict project updates and deletion to the owner membership role.
- [x] Use snippet PATCH as the single project assignment/move/unassignment path; remove the unused dedicated project assignment endpoint and validator.
- [x] Allow all project members to list and read snippet versions.
- [x] Allow owners and editors to delete and restore snippet versions; reject viewers with `403` and non-members with `404`.
- [x] Authorize snippet list/search through personal ownership or project membership in a single database query.
- [x] Authorize snippet deletion through personal ownership or owner/editor project membership.
- [x] Authorize tag-filtered snippet reads through personal ownership or project membership in one database query.
- [x] Authorize tag assignment/removal through personal ownership or owner/editor project membership; reject viewers with `403` and non-members with `404`.
- [x] Allow owners, editors, and viewers to read project snippets, versions, tag-filtered lists, and comments.
- [x] Allow owners and editors to create and modify project snippets, versions, tags, and their own comments. Moving snippets out of a project remains owner-only.
- [x] Return `403` when viewers attempt mutations, including their own comments.
- [x] Return `404` to non-members to avoid exposing project existence, including removed original creators.
- [x] Apply the same access rules to comments; PATCH/DELETE additionally require authorship. Validate comment-read snippet IDs before database access.
- [x] Keep personal snippets authorized through `snippet.user_id`.

### Previous project members API

- [x] Add `GET /api/projects/:projectId/members`.
- [x] Add `PATCH /api/projects/:projectId/members/:userId` for role changes.
- [x] Add `DELETE /api/projects/:projectId/members/:userId`.
- [x] Restrict member management to owners.
- [x] Prevent removing or demoting the sole owner.
- [x] Defer ownership transfer until explicitly needed.


### Recorded verification results (2026-09-17)

- Backend typecheck/build and all five authorization scripts passed: comment checks (50), deletion checks (10), tag checks (22), version checks (28), and list/search SQL checks.
- Frontend typecheck/lint/build and project-count/save-feedback regression checks passed. The existing large-bundle warning remains unrelated.
- 102 live authenticated HTTP scenario checks passed against the native backend at `http://localhost:3000` and existing Docker `snippetvault-db-1`, including 34 comment scenarios. Session fixtures bypassed signup/login only; authentication configuration was unchanged.
- Desktop/mobile frontend smoke checks passed for existing project/snippet/search/assignment/version flows. Project counts and rejected-save permission toasts were fixed and verified; future member/invitation screens remain untested because they do not exist yet.
- Recorded disposable users, sessions, projects, snippets, tags, comments, and versions were removed; existing data was preserved. Native dev servers and the database were left running. No commit or push was performed.

### Workspace authorization verification (2026-09-19)

- Backend typecheck, build, and all eight authorization/validation test files passed after the workspace route migration.
- 55 live authenticated API checks passed against `http://localhost:3000` with disposable owner, editor, viewer, and non-member sessions.
- Live coverage included workspace/member owner protection, project role rules, personal/workspace snippets, unchanged and changed project assignments, cross-workspace rejection, tags, viewer comments with authorship enforcement, versions, nested routes, hidden-resource `404` responses, and denied-role `403` responses.
- All disposable workspaces, memberships, projects, snippets, tags, comments, versions, sessions, and users were removed after the run. Existing data was preserved.
