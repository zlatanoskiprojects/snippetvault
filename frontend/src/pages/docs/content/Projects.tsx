import { DocCallout, DocHeading, DocList, DocParagraph, InlineCode } from '../DocBlocks'
import type { DocHeadingRef } from '../registry'

export const PROJECTS_HEADINGS: DocHeadingRef[] = [
  { id: 'what-are-projects', label: 'What are projects' },
  { id: 'creating-renaming-deleting', label: 'Creating, renaming, deleting' },
  { id: 'assigning-snippets', label: 'Assigning snippets' },
  { id: 'ownership', label: 'Ownership' },
]

export default function Projects() {
  return (
    <div>
      <DocParagraph>
        Projects are a lightweight way to group related snippets — think of them as folders.
      </DocParagraph>

      <DocHeading id="what-are-projects">What are projects</DocHeading>
      <DocParagraph>
        A project has a name and an optional description. A snippet's{' '}
        <InlineCode>project_id</InlineCode> is nullable, so snippets never require one —
        ungrouped snippets simply show up under "All snippets".
      </DocParagraph>

      <DocHeading id="creating-renaming-deleting">Creating, renaming, deleting</DocHeading>
      <DocParagraph>
        The Projects view lets you create a new project, rename it or edit its description,
        and delete it. Deleting a project does not delete the snippets inside it — their{' '}
        <InlineCode>project_id</InlineCode> is simply cleared.
      </DocParagraph>

      <DocHeading id="assigning-snippets">Assigning snippets</DocHeading>
      <DocParagraph>
        In the app, you assign a snippet to a project from the snippet's create/edit form — the
        Project dropdown sends <InlineCode>project_id</InlineCode> along with the rest of the
        snippet payload. The backend also exposes a dedicated endpoint for direct (re)assignment:
      </DocParagraph>
      <DocList
        items={[
          <><InlineCode>PATCH /api/projects/:id/snippets/:snippetId</InlineCode> — assigns the
            given snippet to the given project.</>,
        ]}
      />

      <DocHeading id="ownership">Ownership</DocHeading>
      <DocParagraph>
        Every project query is scoped to your own <InlineCode>user_id</InlineCode>. Assigning a
        snippet to a project — whether through the snippet form or the dedicated endpoint — is
        rejected unless both the snippet and the project belong to you.
      </DocParagraph>

      <DocCallout variant="info" title="Snippet counts">
        The list view shows a snippet count per project computed server-side; the standalone
        Projects page currently displays this count client-side and may show 0 until a snippet
        is opened from that project.
      </DocCallout>
    </div>
  )
}
