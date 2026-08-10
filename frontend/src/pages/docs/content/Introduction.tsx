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
  { title: 'Snippets & Editor', description: 'Write and edit code with a CodeMirror-powered editor across a dozen languages.', color: '#818cf8' },
  { title: 'Collections & Tags', description: 'Group related snippets into collections and label them with global tags.', color: '#4ade80' },
  { title: 'Version History', description: 'Every meaningful edit is snapshotted, so you can review and restore prior versions.', color: '#fbbf24' },
  { title: 'Public Sharing', description: 'Share a single snippet publicly with a share link, without exposing your account.', color: '#a78bfa' },
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
        {FEATURES.map((feature, index) => (
          <Card
            key={feature.title}
            className="group min-h-[148px] border-[#303030] bg-[#1c1c1c] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#454545] hover:bg-[#202020] hover:shadow-[0_10px_28px_rgba(0,0,0,0.2)]"
          >
            <div className="flex h-full flex-col px-5 py-5">
              <div className="mb-4 flex items-center justify-between">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-md border text-[11px] font-semibold tracking-wide"
                  style={{
                    color: feature.color,
                    backgroundColor: `${feature.color}14`,
                    borderColor: `${feature.color}36`,
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full opacity-60 transition-opacity duration-200 group-hover:opacity-100" style={{ backgroundColor: feature.color }} />
              </div>
              <h3 className="mb-1.5 text-sm font-semibold text-white">{feature.title}</h3>
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
