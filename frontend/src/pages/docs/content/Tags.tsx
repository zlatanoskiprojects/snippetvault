import { Link } from 'react-router-dom'
import { DocCallout, DocHeading, DocList, DocParagraph, InlineCode } from '../DocBlocks'
import type { DocHeadingRef } from '../registry'

export const TAGS_HEADINGS: DocHeadingRef[] = [
  { id: 'global-tags', label: 'Global tags' },
  { id: 'attaching-and-detaching', label: 'Attaching and detaching' },
  { id: 'browsing-by-tag', label: 'Browsing by tag' },
  { id: 'tags-and-search', label: 'Tags and search' },
]

export default function Tags() {
  return (
    <div>
      <DocParagraph>
        Tags are short, freeform labels you can attach to snippets to make them easier to find
        later.
      </DocParagraph>

      <DocHeading id="global-tags">Global tags</DocHeading>
      <DocParagraph>
        Tags are not scoped to a user — the <InlineCode>tag</InlineCode> table just has a unique{' '}
        <InlineCode>name</InlineCode>. Creating a tag with a name that already exists returns a 409,
        and the app falls back to reusing the existing tag rather than erroring out. Ownership is
        enforced at the snippet level instead: attaching or detaching a tag always checks that the
        target snippet is yours.
      </DocParagraph>

      <DocHeading id="attaching-and-detaching">Attaching and detaching</DocHeading>
      <DocParagraph>
        In the snippet form, typing a tag name and pressing Enter (or a comma) adds it to the list;
        clicking the × removes it. On save, the app diffs the new tag list against the snippet's
        current tags and calls:
      </DocParagraph>
      <DocList
        items={[
          <><InlineCode>POST /api/tags/:id/snippets/:snippetId</InlineCode> — attach a tag to a snippet.</>,
          <><InlineCode>DELETE /api/tags/:id/snippets/:snippetId</InlineCode> — detach a tag from a snippet.</>,
        ]}
      />

      <DocHeading id="browsing-by-tag">Browsing by tag</DocHeading>
      <DocParagraph>
        The sidebar lists every tag used across your snippets with a count next to it. Clicking a
        tag filters the snippet list down to snippets carrying that tag, backed by{' '}
        <InlineCode>GET /api/tags/:id/snippets</InlineCode>, which is scoped to your own snippets.
      </DocParagraph>

      <DocHeading id="tags-and-search">Tags and search</DocHeading>
      <DocParagraph>
        The dashboard's Search view lets you multi-select tag chips (snippets must match every
        selected tag) alongside a text query. Tag names are also one of the fields the backend's
        optional <InlineCode>?q=</InlineCode> search parameter matches against — see{' '}
        <Link to="/docs/search" className="text-[#6366f1] hover:text-indigo-400 transition-colors duration-150">
          Search
        </Link>{' '}
        for how the two relate.
      </DocParagraph>

      <DocCallout variant="info" title="No tag rename or delete yet">
        There's currently no endpoint to rename or delete a tag outright — only attach/detach on a
        specific snippet.
      </DocCallout>
    </div>
  )
}
