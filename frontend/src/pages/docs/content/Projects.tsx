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
        snippet payload. Existing snippets use the same update endpoint for assignment:
      </DocParagraph>
      <DocList
        items={[
          <><InlineCode>PATCH /api/snippets/:id</InlineCode> — set{' '}
            <InlineCode>project_id</InlineCode> to a project ID to assign or move the snippet,
            or to <InlineCode>null</InlineCode> to unassign it.</>,
        ]}
      />

      <DocHeading id="ownership">Ownership</DocHeading>
      <DocParagraph>
        Assigning a personal snippet requires snippet ownership and an owner or editor role in
        the destination project. Moving or unassigning a project snippet requires an owner role
        in its current project; moving it also requires an owner or editor role in the destination.
      </DocParagraph>

      <DocCallout variant="info" title="Snippet counts">
        The list view shows a snippet count per project computed server-side; the standalone
        Projects page currently displays this count client-side and may show 0 until a snippet
        is opened from that project.
      </DocCallout>
    </div>
  )
}
