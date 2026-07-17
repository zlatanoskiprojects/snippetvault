import { Link } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import { DocHeading, DocParagraph, InlineCode } from '../DocBlocks'
import type { DocHeadingRef } from '../registry'

export const INTRODUCTION_HEADINGS: DocHeadingRef[] = [
  { id: 'key-features', label: 'Key features' },
  { id: 'how-its-built', label: "How it's built" },
  { id: 'next-steps', label: 'Next steps' },
]

const FEATURES = [
  { title: 'Snippets & Editor', description: 'Write and edit code with a CodeMirror-powered editor across a dozen languages.', color: '#6366f1' },
  { title: 'Collections & Tags', description: 'Group related snippets into collections and label them with global tags.', color: '#22c55e' },
  { title: 'Version History', description: 'Every meaningful edit is snapshotted, so you can review and restore prior versions.', color: '#fba528' },
  { title: 'Public Sharing', description: 'Share a single snippet publicly with a share link, without exposing your account.', color: '#8c5af3' },
]

export default function Introduction() {
  return (
    <div>
      <DocParagraph>
        SnippetVault is a full-stack code snippet manager. Authenticate, then create and organize
        snippets into collections, tag them, comment on them, track version history, and share
        individual snippets publicly via share links.
      </DocParagraph>

      <DocHeading id="key-features">Key features</DocHeading>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {FEATURES.map(feature => (
          <Card key={feature.title} accentColor={feature.color} className="flex flex-col">
            <div className="flex flex-col flex-1 px-5 pt-4 pb-5">
              <p className="text-sm font-semibold text-white mb-1.5">{feature.title}</p>
              <p className="text-xs leading-relaxed text-[#9ba3af]">{feature.description}</p>
            </div>
          </Card>
        ))}
      </div>

      <DocHeading id="how-its-built">How it's built</DocHeading>
      <DocParagraph>
        The repo is a monorepo with two independent apps. <InlineCode>backend/</InlineCode> is
        Express and TypeScript on PostgreSQL, using Drizzle ORM for queries and Better Auth for
        session-based authentication. <InlineCode>frontend/</InlineCode> is React and TypeScript
        built with Vite and styled with Tailwind CSS.
      </DocParagraph>

      <DocHeading id="next-steps">Next steps</DocHeading>
      <DocParagraph>
        Ready to run it locally? Head to the{' '}
        <Link to="/docs/quick-start" className="text-[#6366f1] hover:text-indigo-400 transition-colors duration-150">
          Quick Start
        </Link>{' '}
        guide to set up the database, backend, and frontend.
      </DocParagraph>
    </div>
  )
}
