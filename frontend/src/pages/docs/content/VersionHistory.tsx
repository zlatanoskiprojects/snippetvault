import { DocCallout, DocHeading, DocList, DocParagraph, InlineCode } from '../DocBlocks'
import type { DocHeadingRef } from '../registry'

export const VERSION_HISTORY_HEADINGS: DocHeadingRef[] = [
  { id: 'how-versions-are-saved', label: 'How versions are saved' },
  { id: 'viewing-a-version', label: 'Viewing a version' },
  { id: 'restoring-a-version', label: 'Restoring a version' },
  { id: 'deleting-a-version', label: 'Deleting a version' },
]

export default function VersionHistory() {
  return (
    <div>
      <DocParagraph>
        SnippetVault keeps a history of a snippet's code so you can go back to an earlier state.
        Versions are not created on every save — they're saved lazily and deliberately.
      </DocParagraph>

      <DocHeading id="how-versions-are-saved">How versions are saved</DocHeading>
      <DocParagraph>
        A new version is only written when a <InlineCode>PATCH</InlineCode> to a snippet actually
        changes <InlineCode>code</InlineCode>, and only if that exact code isn't already stored as a
        prior version for this snippet — editing back and forth between two known states won't pile
        up duplicate versions. Each saved version gets the next{' '}
        <InlineCode>version_number</InlineCode> for that snippet and an optional{' '}
        <InlineCode>change_note</InlineCode> you can attach from the edit form.
      </DocParagraph>

      <DocHeading id="viewing-a-version">Viewing a version</DocHeading>
      <DocParagraph>
        The History panel lists every saved version with its number, a relative timestamp, and its
        change note (if any). Selecting a version lazily fetches its full code and shows it read-only
        in the same code editor chrome used elsewhere in the app.
      </DocParagraph>
      <DocList
        items={[
          <><InlineCode>GET /api/snippets/:id/versions</InlineCode> — list versions (metadata only).</>,
          <><InlineCode>GET /api/snippets/:id/versions/:versionId</InlineCode> — fetch one version's full code.</>,
        ]}
      />

      <DocHeading id="restoring-a-version">Restoring a version</DocHeading>
      <DocParagraph>
        Restoring calls <InlineCode>POST /api/snippets/:id/versions/:versionId/restore</InlineCode>.
        If the snippet's current code differs from the version being restored, the current code is
        first snapshotted as a new version (change note{' '}
        <InlineCode>"Auto-save before restore to v&lt;n&gt;"</InlineCode>) so it isn't lost, and only
        then does the snippet's code get replaced with the target version's code.
      </DocParagraph>

      <DocHeading id="deleting-a-version">Deleting a version</DocHeading>
      <DocParagraph>
        Individual versions can be deleted from the History panel via{' '}
        <InlineCode>DELETE /api/snippets/:id/versions/:versionId</InlineCode>. Deleting a version
        only removes that snapshot — it has no effect on the snippet's current code.
      </DocParagraph>

      <DocCallout variant="info" title="Scoped to your snippets">
        Every version route first checks that the parent snippet belongs to you before touching any
        version rows.
      </DocCallout>
    </div>
  )
}
