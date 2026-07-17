import { DocCallout, DocHeading, DocList, DocParagraph, InlineCode } from '../DocBlocks'
import type { DocHeadingRef } from '../registry'

export const COMMENTS_HEADINGS: DocHeadingRef[] = [
  { id: 'commenting-on-snippets', label: 'Commenting on snippets' },
  { id: 'editing-and-deleting-comments', label: 'Editing and deleting comments' },
  { id: 'current-status', label: 'Current status' },
]

export default function Comments() {
  return (
    <div>
      <DocParagraph>
        Snippets support threaded notes in the form of comments, backed by a dedicated{' '}
        <InlineCode>comment</InlineCode> table.
      </DocParagraph>

      <DocHeading id="commenting-on-snippets">Commenting on snippets</DocHeading>
      <DocParagraph>
        Comments are only readable and postable by the snippet's owner — the backend checks that
        the snippet belongs to <InlineCode>req.userId</InlineCode> before returning or accepting any
        comment, so this currently works as private notes attached to your own snippets rather than
        multi-user discussion.
      </DocParagraph>
      <DocList
        items={[
          <><InlineCode>GET /api/snippets/:snippetId/comments</InlineCode> — list comments, oldest first.</>,
          <><InlineCode>POST /api/snippets/:snippetId/comments</InlineCode> — add a comment (up to 2,000 characters).</>,
        ]}
      />

      <DocHeading id="editing-and-deleting-comments">Editing and deleting comments</DocHeading>
      <DocParagraph>
        You can only edit or delete your own comments — both routes check{' '}
        <InlineCode>comment.user_id</InlineCode> against your session:
      </DocParagraph>
      <DocList
        items={[
          <><InlineCode>PATCH /api/comments/:id</InlineCode> — update a comment's content.</>,
          <><InlineCode>DELETE /api/comments/:id</InlineCode> — remove a comment.</>,
        ]}
      />

      <DocHeading id="current-status">Current status</DocHeading>
      <DocCallout variant="warning" title="Not wired into the dashboard yet">
        The comments API is fully implemented and has a matching frontend API client, but there's no
        comments panel in the snippet detail view yet — the feature isn't currently reachable from
        the UI.
      </DocCallout>
    </div>
  )
}
