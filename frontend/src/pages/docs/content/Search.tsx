import { DocCallout, DocHeading, DocList, DocParagraph, InlineCode } from '../DocBlocks'
import type { DocHeadingRef } from '../registry'

export const SEARCH_HEADINGS: DocHeadingRef[] = [
  { id: 'dashboard-search', label: 'Dashboard search' },
  { id: 'filtering-and-sorting', label: 'Filtering and sorting' },
  { id: 'api-level-search', label: 'API-level search' },
]

export default function Search() {
  return (
    <div>
      <DocParagraph>
        SnippetVault has two related but distinct ways to search: the dashboard's Search view, and
        an optional query parameter on the snippet list endpoint.
      </DocParagraph>

      <DocHeading id="dashboard-search">Dashboard search</DocHeading>
      <DocParagraph>
        Clicking the search icon (or focusing the sidebar search field) opens the Search view. It
        works entirely client-side against the snippets already loaded for your account, matching
        your query against title, description, code, and tags.
      </DocParagraph>

      <DocHeading id="filtering-and-sorting">Filtering and sorting</DocHeading>
      <DocParagraph>
        Alongside the text query, the Search view offers:
      </DocParagraph>
      <DocList
        items={[
          'Language chips — narrow results to a single language.',
          'Tag chips — multi-select; a snippet must match every selected tag.',
          'Sort — by date modified, date created, or title A–Z.',
        ]}
      />

      <DocHeading id="api-level-search">API-level search</DocHeading>
      <DocParagraph>
        Separately, <InlineCode>GET /api/snippets</InlineCode> accepts an optional{' '}
        <InlineCode>?q=</InlineCode> parameter that performs a case-insensitive match on the server
        against <InlineCode>title</InlineCode>, <InlineCode>language</InlineCode>,{' '}
        <InlineCode>description</InlineCode>, tag names, and <InlineCode>code</InlineCode>, scoped to
        your own snippets.
      </DocParagraph>

      <DocCallout variant="info" title="Not connected yet">
        The dashboard's Search view doesn't currently call the API with <InlineCode>?q=</InlineCode>{' '}
        — it filters the already-loaded snippet list in the browser instead. The server-side search
        parameter works and is available to any client, it's just not wired up in this UI yet.
      </DocCallout>
    </div>
  )
}
