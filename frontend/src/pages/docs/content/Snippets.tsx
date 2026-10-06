import { Link } from 'react-router-dom'
import { DocCallout, DocHeading, DocList, DocParagraph, InlineCode } from '../DocBlocks'
import type { DocHeadingRef } from '../registry'

export const SNIPPETS_HEADINGS: DocHeadingRef[] = [
  { id: 'creating-a-snippet', label: 'Creating a snippet' },
  { id: 'the-code-editor', label: 'The code editor' },
  { id: 'supported-languages', label: 'Supported languages' },
  { id: 'visibility', label: 'Visibility' },
  { id: 'editing-and-deleting', label: 'Editing and deleting' },
]

export default function Snippets() {
  return (
    <div>
      <DocParagraph>
        A snippet is the core unit in SnippetVault: a title, an optional description, a language,
        and a block of code. Every snippet belongs to you and can optionally live inside a
        project.
      </DocParagraph>

      <DocHeading id="creating-a-snippet">Creating a snippet</DocHeading>
      <DocParagraph>
        From the dashboard, "+ New snippet" opens a form with the following fields:
      </DocParagraph>
      <DocList
        items={[
          <><InlineCode>title</InlineCode> — required, up to 200 characters.</>,
          <><InlineCode>description</InlineCode> — optional, up to 5,000 characters.</>,
          <><InlineCode>language</InlineCode> — required, picked from the supported language list below.</>,
          <><InlineCode>code</InlineCode> — required, up to 65,000 characters.</>,
          <><InlineCode>project</InlineCode> — optional. Snippets don't need a project; see{' '}
            <Link to="/docs/projects" className="text-accent hover:text-accent-text-hover transition-colors duration-150">Projects</Link>.
          </>,
          <>tags — optional at creation time; see <Link to="/docs/tags" className="text-accent hover:text-accent-text-hover transition-colors duration-150">Tags</Link>.</>,
        ]}
      />

      <DocHeading id="the-code-editor">The code editor</DocHeading>
      <DocParagraph>
        Code is written in a CodeMirror 6 editor (via <InlineCode>@uiw/react-codemirror</InlineCode>)
        with the One Dark theme, line numbers, bracket matching, and syntax highlighting for the
        selected language.
      </DocParagraph>

      <DocHeading id="supported-languages">Supported languages</DocHeading>
      <DocParagraph>
        The language field is validated server-side against a fixed list — an unsupported value is
        rejected with a 400 response:
      </DocParagraph>
      <DocList
        items={['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'SQL'].map(lang => (
          <InlineCode key={lang}>{lang}</InlineCode>
        ))}
      />

      <DocHeading id="visibility">Visibility</DocHeading>
      <DocParagraph>
        Every snippet has a <InlineCode>visibility</InlineCode> of <InlineCode>private</InlineCode>{' '}
        (the default) or <InlineCode>public</InlineCode>. Switching a snippet to public generates a
        share link you can hand out without giving someone access to your account — see{' '}
        <Link to="/docs/public-sharing" className="text-accent hover:text-accent-text-hover transition-colors duration-150">
          Public Sharing
        </Link>{' '}
        for the details.
      </DocParagraph>

      <DocHeading id="editing-and-deleting">Editing and deleting</DocHeading>
      <DocParagraph>
        Editing a snippet reuses the same form. If the edit changes the code, a version snapshot of
        the previous code may be saved automatically — see{' '}
        <Link to="/docs/version-history" className="text-accent hover:text-accent-text-hover transition-colors duration-150">
          Version History
        </Link>. Deleting a snippet is permanent and only works on snippets you own.
      </DocParagraph>

      <DocCallout variant="info" title="No favorites yet">
        There's currently no "favorite" or "star" concept on snippets — organize with projects
        and tags instead.
      </DocCallout>
    </div>
  )
}
