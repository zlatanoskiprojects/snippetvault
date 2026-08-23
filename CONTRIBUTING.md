# Contributing to SnippetVault

Thanks for helping improve SnippetVault. Bug fixes, focused features, documentation, accessibility, security, and performance improvements are welcome.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Set Up the Development Environment](#set-up-the-development-environment)
- [Making Your First Contribution](#making-your-first-contribution)
  - [Find Something to Work On](#find-something-to-work-on)
  - [Contribution Process](#contribution-process)
- [Development Guidelines](#development-guidelines)
  - [Code Style](#code-style)
  - [Backend Conventions](#backend-conventions)
  - [Frontend Conventions](#frontend-conventions)
  - [Database Changes](#database-changes)
  - [Security](#security)
  - [Commit Messages](#commit-messages)
  - [Verification](#verification)
  - [Project Structure](#project-structure)
- [Using AI](#using-ai)
- [Need Help?](#need-help)
- [Types of Contributions](#types-of-contributions)

## Code of Conduct

Be respectful and constructive. Follow the standards in the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## Getting Started

### Prerequisites

- Node.js 20 or newer
- pnpm 10.32.1
- Git
- Docker with Docker Compose for the local PostgreSQL database

### Set Up the Development Environment

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/snippetvault.git
   cd snippetvault
   ```

2. Install the backend and frontend dependencies:

   ```bash
   pnpm --dir backend install --frozen-lockfile
   pnpm --dir frontend install --frozen-lockfile
   ```

3. Create `.env` in the repository root for Docker:

   ```env
   POSTGRES_DB=snippetvault
   POSTGRES_USER=sv_user
   POSTGRES_PASSWORD=sv_password
   ```

4. Copy the backend environment template and update its values:

   ```bash
   cp backend/.env.example backend/.env
   ```

   At minimum, make sure these values match your local setup:

   ```env
   PORT=3000
   DATABASE_URL=postgresql://sv_user:sv_password@localhost:5433/snippetvault
   CLIENT_URL=http://localhost:5173
   BETTER_AUTH_URL=http://localhost:3000
   BETTER_AUTH_SECRET=replace-with-a-random-secret
   AI_KEY_SECRET=replace-with-a-different-random-secret
   GOOGLE_CLIENT_ID=placeholder
   GOOGLE_CLIENT_SECRET=placeholder
   GITHUB_CLIENT_ID=placeholder
   GITHUB_CLIENT_SECRET=placeholder
   ```

   `RESEND_API_KEY` is needed to receive verification and email-change messages. Cloudflare Turnstile and Google/GitHub sign-in are optional; configure both sides of each integration only when you need to test it. Never commit an `.env` file or real credentials.

5. Start PostgreSQL. On first start, Docker seeds the baseline schema from `backend/drizzle/0000_wise_shen.sql`:

   ```bash
   docker compose up -d db
   ```

6. Create `frontend/.env`:

   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

   Add `VITE_TURNSTILE_SITE_KEY` only if the backend also has `TURNSTILE_SECRET_KEY` configured.

7. Start the apps in separate terminals:

   ```bash
   pnpm --dir backend dev
   ```

   ```bash
   pnpm --dir frontend dev
   ```

The frontend runs at [http://localhost:5173](http://localhost:5173), the API at [http://localhost:3000/api](http://localhost:3000/api), and PostgreSQL on port `5433`. See [quickstart.md](quickstart.md) for troubleshooting.

## Making Your First Contribution

### Find Something to Work On

- Browse the [open issues](https://github.com/Zlatanoski/snippetvault/issues).
- Choose a small bug or documentation improvement for a first contribution.
- Open or comment on an issue before starting a large feature, schema change, or architectural refactor.

### Contribution Process

1. Create a branch from `dev`:

   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b fix/short-description
   ```

   Use `feat/`, `docs/`, `refactor/`, or `chore/` when one of those better describes the work.

2. Keep the change focused. Avoid unrelated formatting, dependency upgrades, or speculative refactors.

3. Verify the affected app and manually exercise the changed user flow.

4. Commit the change using a conventional commit:

   ```bash
   git commit -m "fix: prevent unauthorized snippet updates"
   ```

5. Push your branch and open a pull request against `dev`:

   ```bash
   git push origin fix/short-description
   ```

Describe the problem, the solution, and how you verified it. Call out migrations, environment changes, security implications, and visible UI changes. Include screenshots for UI work when useful.

## Development Guidelines

### Code Style

- Match the existing TypeScript style in the area you change.
- Prefer existing helpers, components, and dependencies over new abstractions or packages.
- Keep code self-explanatory; do not add inline comments, block comments, or docstrings.
- Keep pull requests narrow and remove dead code introduced by the change.

### Backend Conventions

- Use Drizzle for every database query. Never interpolate user input into raw SQL.
- Keep Drizzle fields and TypeScript variables in `camelCase`, then map API responses to `snake_case` at the route boundary.
- Protect resource routes with `authMiddleware` and include `req.userId` ownership in database filters.
- Validate every mutation with `express-validator` and check `validationResult` before accessing the database.
- Verify that referenced collections and snippets belong to the signed-in user before assigning relationships.
- Leave the Better Auth handler before `express.json()` in `backend/src/index.ts`; it requires the raw request body.
- Keep `backend/src/constants/languages.ts` synchronized with `frontend/src/constants/languages.ts`.

### Frontend Conventions

- Use the API modules in `frontend/src/api/`; keep `credentials: 'include'` and route errors through `throwIfNotOk`.
- Reuse the primitives in `frontend/src/components/ui/` and `cn()` from `frontend/src/lib/utils.ts`.
- Use Tailwind CSS for styling and Lucide for icons. Do not add another UI or CSS library for an existing capability.
- Preserve keyboard access, visible focus states, labels, and responsive behavior.
- Never render user-controlled snippet, description, or comment content with unsanitized `dangerouslySetInnerHTML`.

### Database Changes

The Drizzle schema in `backend/src/db/schema.ts` is authoritative. When it changes, generate and commit the matching migration:

```bash
pnpm --dir backend exec drizzle-kit generate
pnpm --dir backend migrate
```

Review generated SQL before committing it. Add indexes for foreign keys and columns used frequently in filters or joins, and avoid N+1 query patterns.

### Security

- Follow OWASP guidance for authentication, authorization, validation, output handling, and secrets.
- Never weaken the explicit CORS/trusted-origin allowlist or expose private fields through public sharing.
- Keep sessions server-side and let Better Auth manage passwords and authentication flows.
- Never log or return passwords, tokens, API keys, or decrypted secrets.
- Avoid dependencies with known vulnerabilities and explain any security-sensitive tradeoff in the pull request.

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new behavior
- `fix:` bug fix
- `docs:` documentation only
- `refactor:` behavior-preserving code change
- `test:` test changes
- `chore:` maintenance

Write the subject in the imperative mood and keep each commit about one coherent change.

### Verification

Run the checks relevant to your change:

```bash
pnpm --dir backend typecheck
pnpm --dir backend build
pnpm --dir frontend exec tsc -b
pnpm --dir frontend lint
pnpm --dir frontend build
```

There is not yet a general automated test suite. Include reproducible manual verification steps in the pull request, and add focused regression coverage when changing security-sensitive or non-trivial behavior.

### Project Structure

```text
snippetvault/
├── backend/
│   ├── drizzle/          PostgreSQL migrations
│   └── src/
│       ├── db/           Drizzle schema
│       ├── lib/          Auth, database, and shared backend utilities
│       ├── middleware/   Authentication, rate limits, and error handling
│       ├── routes/       Express resource routes
│       └── validators/   Request validation chains
├── frontend/
│   └── src/
│       ├── api/          Backend API clients and response types
│       ├── components/   Reusable UI and feature components
│       ├── contexts/     User and toast state
│       ├── hooks/        Data-fetching hooks
│       └── pages/        App, public sharing, landing, and documentation views
├── docker-compose.yml    Local PostgreSQL service
└── quickstart.md         Local development walkthrough
```

SnippetVault currently supports authentication, snippets, collections, tags, comments, search, version history, profile management, encrypted per-user AI settings, and public share links. Keep changes consistent across the API, UI, and documentation when a feature spans those layers.

## Using AI

AI tools are welcome for exploration, implementation, and review, but contributors remain responsible for every submitted line.

- Understand the problem and the generated changes before opening a pull request.
- Write issue reports, pull request descriptions, and review replies in your own words.
- Reproduce bugs and verify behavior yourself; generated output is not proof of correctness.
- Keep unrelated, speculative, or unexplained generated changes out of the pull request.
- Be ready to explain the design, tradeoffs, and verification without relying on the tool that produced the change.

## Need Help?

- Ask a focused question in a [GitHub issue](https://github.com/Zlatanoski/snippetvault/issues).
- Include your operating system, Node.js version, command, and full non-secret error output for setup problems.
- Search existing issues before opening a duplicate.

## Types of Contributions

- Bug fixes
- Focused, discussed features
- Documentation improvements
- Accessibility improvements
- Security hardening
- Performance improvements backed by a reproducible bottleneck

Thanks for contributing to SnippetVault.
