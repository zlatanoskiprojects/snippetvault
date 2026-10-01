# Issue tracker: GitHub

Issues and specs for this repo live in GitHub Issues at `Zlatanoski/snippetvault`. Use `gh` from this repository.

## Conventions

- Create, read, list, comment on, label, and close issues with `gh issue`.
- For multiline issue bodies, write the exact text to a temporary file and pass `--body-file`.
- Fetch comments and labels when a skill needs the full ticket context.
- Resolve a bare `#number` as a PR first, then as an issue, because GitHub shares their number space.

## Pull requests as a triage surface

PRs as a request surface: no. Change this flag to `yes` if external PRs should enter the triage queue.

## Skill operations

- “Publish to the issue tracker” means create a GitHub issue.
- “Fetch the relevant ticket” means read the GitHub issue and its comments.
- `/wayfinder` uses one `wayfinder:map` issue with child issues, GitHub sub-issues where available, and native issue dependencies where available. Fall back to a task list and `Blocked by: #number` lines when those features are unavailable.
- Claim an unblocked, unassigned child with `gh issue edit <number> --add-assignee @me`; resolve it with a comment and closure.
