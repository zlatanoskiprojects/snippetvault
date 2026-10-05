# Docs Migration Plan (Mintlify)

Implements ADR 0002 (`docs/adr/0002-host-public-documentation-on-mintlify.md`). Vocabulary: `CONTEXT.md`. Reference model: https://kaneo.app/docs (structure, grouping, page style only).

## Decisions

- Mirror Kaneo's information architecture and page style. Write a page only for features SnippetVault has.
- Content lives in `docs-site/` in this repo (Mintlify Git sync, subfolder). Entry file `docs-site/docs.json`.
- Design matches the app as closely as Mintlify allows (see Design). The frontend visual tester is not used for this work.
- No API reference. No integrations, workflows or Gantt pages (features do not exist).
- Run 1 is text only. Run 2 (user-orchestrated) adds screenshots; leave an image slot comment-free by omitting images, not placeholder text.
- New workspace, member and invitation pages are written first. Old React pages are rewritten, not copied, as they are ported.
- Cutover happens only after the Mintlify site is live: delete `frontend/src/pages/docs/` and its routes, redirect `snippetvault.me/docs` and `/docs/:slug` to `docs.snippetvault.me`.
- Terminology: Member, Role, Invitation, Accept, Decline, Share link. Never: collaborator, reject, share token, collection.

## Design

Goal: docs look like the rest of SnippetVault. Source of truth is `frontend/src/index.css` (`--theme-*` tokens), not the older palette in `CLAUDE.md`.

- Light and dark: the app defines both (`:root` dark, `[data-theme="light"]`). Docs support both, following the system setting, with the same token values.
- Colors: accent `#6366f1`; app, sidebar, surface, border and text tokens copied from `index.css` into `docs.json` `colors`/`background` and into `docs-site/style.css` as CSS variables.
- Typography: Inter 400-700, matching `frontend/index.html`.
- Logo and favicon: `frontend/public/code_logo.svg`, `favicon.svg`, `favicon.ico`, copied into `docs-site/`.
- Shape: 6px radius for buttons and inputs, 4px for tags and badges; subtle 1px borders; no heavy shadows.
- Mintlify only allows customization through `docs.json` and a custom CSS file. Use `style.css` to align cards, callouts, code blocks, sidebar active state and borders with the tokens above. No React components, no Tailwind, no custom JS.
- Where Mintlify cannot match the app, keep its default and do not fight the platform.
- Code blocks: dark editor surface matching the app's One Dark editor.

## Open items

- Can viewers comment? Code (`backend/src/permissions/workspacePermissions.ts`) grants viewers `createComment`; `CLAUDE.md` says read-only. Members and roles page follows the code and flags this until decided.

## Page inventory

Each page is one independent task unit. "Source of truth" is where the writer verifies behaviour; docs must match code, not the old pages.

| # | Path in `docs-site/` | Section | Source of truth | Replaces |
|---|---|---|---|---|
| 1 | `index.mdx` Introduction | Get started | `CONTEXT.md`, `frontend/src/pages/docs/content/Introduction.tsx` | Introduction |
| 2 | `first-workspace.mdx` | Get started | `frontend/src/hooks/useWorkspaces.ts`, `backend/src/routes/workspace.ts` | new |
| 3 | `workspaces-and-projects.mdx` | Using SnippetVault | `routes/workspace.ts`, `routes/projects.ts`, `frontend/src/pages/ProjectsView.tsx` | Projects |
| 4 | `snippets.mdx` | Using SnippetVault | `routes/snippets.ts`, `constants/languages.ts` | Snippets |
| 5 | `tags.mdx` | Using SnippetVault | `routes/tags.ts` | Tags |
| 6 | `version-history.mdx` | Using SnippetVault | `shouldSaveVersion` in `routes/snippets.ts` | Version History |
| 7 | `comments.mdx` | Using SnippetVault | `routes/comments.ts`, permissions table | Comments |
| 8 | `search.mdx` | Using SnippetVault | `frontend/src/hooks/useSnippets.ts` | Search |
| 9 | `public-sharing.mdx` | Using SnippetVault | `routes/share.ts`, `SharedSnippetView.tsx` | Public Sharing |
| 10 | `members-and-roles.mdx` | Using SnippetVault | `workspacePermissions.ts`, `routes/workspace.ts`, `MembersView.tsx` | new |
| 11 | `invitations.mdx` | Using SnippetVault | `routes/invitations.ts`, `lib/invitationToken.ts`, `InvitationsView.tsx`, `InvitationView.tsx`, `lib/invitationNavigation.ts` | new |
| 12 | `account.mdx` | Account | `routes/profile.ts`, `routes/aiSettings.ts`, `lib/emailChange*.ts`, ADR 0001 | new |
| 13 | `self-host.mdx` | Self-host | none | "Coming soon" stub, no instructions |

Dropped: old Quick Start and old API Reference. Dev setup stays in `AGENTS.md`/`CLAUDE.md`.

## Task breakdown

- **T0 Scaffold** (blocks all): `docs-site/docs.json` (name, colors, logo, navigation groups per table), `docs-site/style.css` per Design, logo/favicon assets, `docs-site/README.md` with `npx mint dev` instructions, `.gitignore` entries. Done when `mint dev` renders an empty nav with all 13 entries.
- **T1 New feature pages** (parallel after T0): rows 2, 10, 11, 12.
- **T2 Ported pages** (parallel after T0): rows 1, 3-9. Rewrite against current code; correct stale claims (workspace-scoped routes, workspace roles, project snippet counts).
- **T3 Self-host stub**: row 13.
- **T4 Glossary check** (after T1, T2): every term used in docs appears in `CONTEXT.md`; add missing ones.
- **T5 Cutover** (after site is live and user confirms): redirects, delete React docs, update landing/footer links, update `CLAUDE.md`/`AGENTS.md` docs references.
- **T6 Screenshots** (separate run, user-orchestrated): add images to pages 2, 3, 4, 9, 10, 11, 12.

T1 and T2 pages may link to each other by path in the table above, so paths are fixed here.

## Page style (all writers follow)

- Frontmatter: `title`, `description` (one sentence).
- Open with what the feature is and who can use it (role) in two sentences.
- Task-oriented headings ("Invite a member", not "Invitations overview"). Numbered steps for procedures, UI labels in bold.
- State the minimum role required for every action.
- Use Mintlify `Note`/`Warning` components sparingly; no emojis, no marketing language.
- Link related pages by path. No code comments, no API endpoints, no env values.

## Acceptance (per page)

- Every behavioural claim traced to its source of truth file.
- Uses only canonical terms from `CONTEXT.md`.
- Role requirements match `workspacePermissions.ts`.
- Renders under `mint dev` without warnings; no broken links (`mint broken-links`).
