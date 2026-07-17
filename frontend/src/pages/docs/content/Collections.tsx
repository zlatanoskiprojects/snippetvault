import { DocCallout, DocHeading, DocList, DocParagraph, InlineCode } from '../DocBlocks'
import type { DocHeadingRef } from '../registry'

export const COLLECTIONS_HEADINGS: DocHeadingRef[] = [
  { id: 'what-are-collections', label: 'What are collections' },
  { id: 'creating-renaming-deleting', label: 'Creating, renaming, deleting' },
  { id: 'assigning-snippets', label: 'Assigning snippets' },
  { id: 'ownership', label: 'Ownership' },
]

export default function Collections() {
  return (
    <div>
      <DocParagraph>
        Collections are a lightweight way to group related snippets — think of them as folders.
      </DocParagraph>

      <DocHeading id="what-are-collections">What are collections</DocHeading>
      <DocParagraph>
        A collection has a name and an optional description. A snippet's{' '}
        <InlineCode>collection_id</InlineCode> is nullable, so snippets never require one —
        ungrouped snippets simply show up under "All snippets".
      </DocParagraph>

      <DocHeading id="creating-renaming-deleting">Creating, renaming, deleting</DocHeading>
      <DocParagraph>
        The Collections view lets you create a new collection, rename it or edit its description,
        and delete it. Deleting a collection does not delete the snippets inside it — their{' '}
        <InlineCode>collection_id</InlineCode> is simply cleared.
      </DocParagraph>

      <DocHeading id="assigning-snippets">Assigning snippets</DocHeading>
      <DocParagraph>
        In the app, you assign a snippet to a collection from the snippet's create/edit form — the
        Collection dropdown sends <InlineCode>collection_id</InlineCode> along with the rest of the
        snippet payload. The backend also exposes a dedicated endpoint for direct (re)assignment:
      </DocParagraph>
      <DocList
        items={[
          <><InlineCode>PATCH /api/collections/:id/snippets/:snippetId</InlineCode> — assigns the
            given snippet to the given collection.</>,
        ]}
      />

      <DocHeading id="ownership">Ownership</DocHeading>
      <DocParagraph>
        Every collection query is scoped to your own <InlineCode>user_id</InlineCode>. Assigning a
        snippet to a collection — whether through the snippet form or the dedicated endpoint — is
        rejected unless both the snippet and the collection belong to you.
      </DocParagraph>

      <DocCallout variant="info" title="Snippet counts">
        The list view shows a snippet count per collection computed server-side; the standalone
        Collections page currently displays this count client-side and may show 0 until a snippet
        is opened from that collection.
      </DocCallout>
    </div>
  )
}
