import { DocCallout, DocHeading, DocParagraph, InlineCode } from '../DocBlocks'
import type { DocHeadingRef } from '../registry'

export const PUBLIC_SHARING_HEADINGS: DocHeadingRef[] = [
  { id: 'visibility-and-share-tokens', label: 'Visibility and share tokens' },
  { id: 'the-public-share-page', label: 'The public share page' },
  { id: 'what-gets-exposed', label: 'What gets exposed' },
  { id: 'revoking-access', label: 'Revoking access' },
]

export default function PublicSharing() {
  return (
    <div>
      <DocParagraph>
        Any snippet can be shared with people who don't have a SnippetVault account, without giving
        them access to the rest of your vault.
      </DocParagraph>

      <DocHeading id="visibility-and-share-tokens">Visibility and share tokens</DocHeading>
      <DocParagraph>
        Setting a snippet's <InlineCode>visibility</InlineCode> to <InlineCode>public</InlineCode>{' '}
        (at creation or via edit) generates a random share token —{' '}
        <InlineCode>crypto.randomBytes(24)</InlineCode>, base64url-encoded — and stores it on the
        snippet. If the snippet is already public and you save it again, the existing token is
        reused rather than replaced.
      </DocParagraph>

      <DocHeading id="the-public-share-page">The public share page</DocHeading>
      <DocParagraph>
        A public snippet is viewable, unauthenticated, at{' '}
        <InlineCode>/share/&lt;token&gt;</InlineCode>, which calls{' '}
        <InlineCode>GET /api/share/:token</InlineCode> — the only endpoint in the app that doesn't
        require a session. The page shows the code, title, description, tags, and timestamps
        read-only in the same editor chrome used elsewhere.
      </DocParagraph>

      <DocHeading id="what-gets-exposed">What gets exposed</DocHeading>
      <DocParagraph>
        The public endpoint only ever returns a row where <InlineCode>visibility = 'public'</InlineCode>{' '}
        and the token matches — a wrong or private token gets a generic 404. The response includes an{' '}
        <InlineCode>owner_name</InlineCode> (the owner's display name, falling back to their
        username) so visitors know who shared it, but never their email, user id, or any other
        account details.
      </DocParagraph>

      <DocHeading id="revoking-access">Revoking access</DocHeading>
      <DocParagraph>
        Switching visibility back to <InlineCode>private</InlineCode> clears the stored token
        entirely, so the old share link stops resolving immediately. If you publish the snippet
        again later, a brand new token is issued — the previous link is gone for good, it isn't
        reactivated.
      </DocParagraph>

      <DocCallout variant="warning" title="No copy-link button yet">
        The dashboard doesn't currently surface a "copy share link" action in the UI — the{' '}
        <InlineCode>share_token</InlineCode> is returned on the snippet object, and the link is{' '}
        <InlineCode>/share/&lt;share_token&gt;</InlineCode>, but you'll need to construct it
        yourself for now.
      </DocCallout>
    </div>
  )
}
