import { DocCallout, DocCodeBlock, DocHeading, DocList, DocParagraph, InlineCode } from '../DocBlocks'
import type { DocHeadingRef } from '../registry'

export const QUICK_START_HEADINGS: DocHeadingRef[] = [
  { id: 'prerequisites', label: 'Prerequisites' },
  { id: 'database', label: 'Database' },
  { id: 'backend', label: 'Backend' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
]

export default function QuickStart() {
  return (
    <div>
      <DocParagraph>
        This guide walks through spinning up SnippetVault locally: the Postgres database, the
        Express backend, and the Vite frontend.
      </DocParagraph>

      <DocHeading id="prerequisites">Prerequisites</DocHeading>
      <DocList
        items={[
          'Node.js 20+',
          'Docker (or Podman) for running PostgreSQL via docker compose',
          <>npm — the repo's manifests are installed with npm</>,
        ]}
      />

      <DocHeading id="database">Database</DocHeading>
      <DocParagraph>
        Create a <InlineCode>.env</InlineCode> at the repo root with your desired Postgres credentials:
      </DocParagraph>
      <DocCodeBlock
        filename=".env"
        language="env"
        code={'POSTGRES_DB=snippetvault\nPOSTGRES_USER=sv_user\nPOSTGRES_PASSWORD=sv_password'}
      />
      <DocParagraph>Then start the database:</DocParagraph>
      <DocCodeBlock language="bash" code="docker compose up -d db" />
      <DocParagraph>
        Postgres 16 listens on your machine at <InlineCode>localhost:5433</InlineCode> (container port
        5432 mapped to host 5433). On first start, the schema is seeded automatically from{' '}
        <InlineCode>backend/drizzle/0000_wise_shen.sql</InlineCode>.
      </DocParagraph>

      <DocHeading id="backend">Backend</DocHeading>
      <DocParagraph>Create <InlineCode>backend/.env</InlineCode>:</DocParagraph>
      <DocCodeBlock
        filename="backend/.env"
        language="env"
        code={'PORT=3000\nDATABASE_URL=postgresql://user:password@localhost:5433/snippetvault\nCLIENT_URL=http://localhost:5173\nBETTER_AUTH_URL=http://localhost:3000\nGOOGLE_CLIENT_ID=placeholder\nGOOGLE_CLIENT_SECRET=placeholder\nGITHUB_CLIENT_ID=placeholder\nGITHUB_CLIENT_SECRET=placeholder'}
      />
      <DocCallout variant="info" title="Social login is optional">
        Google and GitHub sign-in are only enabled when both of their env vars are set to a real
        value — leaving them as <InlineCode>placeholder</InlineCode> skips registering that provider.
      </DocCallout>
      <DocParagraph>Install dependencies and start the server:</DocParagraph>
      <DocCodeBlock language="bash" code={'cd backend\nnpm install\nnpm run dev'} />

      <DocHeading id="frontend">Frontend</DocHeading>
      <DocParagraph>Create <InlineCode>frontend/.env</InlineCode>:</DocParagraph>
      <DocCodeBlock filename="frontend/.env" language="env" code="VITE_API_URL=http://localhost:3000/api" />
      <DocParagraph>Install dependencies and start the dev server:</DocParagraph>
      <DocCodeBlock language="bash" code={'cd frontend\nnpm install\nnpm run dev'} />
      <DocParagraph>
        The app is now running at <InlineCode>http://localhost:5173</InlineCode>.
      </DocParagraph>

      <DocHeading id="troubleshooting">Troubleshooting</DocHeading>
      <DocCallout variant="warning" title="Database connection refused">
        Make sure the Postgres container is actually running and listening on port{' '}
        <InlineCode>5433</InlineCode> — check with <InlineCode>docker compose ps</InlineCode>.
      </DocCallout>
      <DocCallout variant="warning" title="CORS errors in the browser">
        <InlineCode>CLIENT_URL</InlineCode> in <InlineCode>backend/.env</InlineCode> must exactly match
        the origin you're loading the frontend from.
      </DocCallout>
    </div>
  )
}
