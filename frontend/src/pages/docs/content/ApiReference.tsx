import { DocCallout, DocCodeBlock, DocHeading, DocParagraph, DocTable, InlineCode } from '../DocBlocks'
import type { DocHeadingRef } from '../registry'

export const API_REFERENCE_HEADINGS: DocHeadingRef[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'auth', label: 'Auth' },
  { id: 'snippets', label: 'Snippets' },
  { id: 'versions', label: 'Versions' },
  { id: 'projects', label: 'Projects' },
  { id: 'tags', label: 'Tags' },
  { id: 'comments', label: 'Comments' },
  { id: 'profile', label: 'Profile' },
  { id: 'sharing', label: 'Sharing' },
]

export default function ApiReference() {
  return (
    <div>
      <DocHeading id="overview">Overview</DocHeading>
      <DocParagraph>
        In local development the API is served from <InlineCode>http://localhost:3000/api</InlineCode>.
        Every endpoint except <InlineCode>/api/auth/*</InlineCode> and{' '}
        <InlineCode>GET /api/share/:token</InlineCode> requires an authenticated session — there is
        no API key or bearer token. Better Auth issues a session cookie on sign-in, so requests need{' '}
        <InlineCode>credentials: 'include'</InlineCode> to send it. Responses are JSON with{' '}
        <InlineCode>snake_case</InlineCode> keys, even though the server's internal models are
        camelCase.
      </DocParagraph>
      <DocCodeBlock
        language="ts"
        code={"const res = await fetch(`${API_URL}/snippets`, {\n  credentials: 'include',\n})\n\nif (!res.ok) throw new Error('Request failed')\nconst snippets = await res.json()"}
      />
      <DocCallout variant="info" title="No stability guarantee">
        This API doesn't have a versioning scheme or a stability guarantee yet — routes, fields, and
        error shapes can change without notice.
      </DocCallout>

      <DocHeading id="auth">Auth</DocHeading>
      <DocParagraph>
        Authentication is handled entirely by Better Auth at <InlineCode>/api/auth/*</InlineCode> —
        there's no custom auth route file.
      </DocParagraph>
      <DocTable
        headers={['Method', 'Endpoint', 'Description']}
        rows={[
          ['POST', <InlineCode>/api/auth/sign-up/email</InlineCode>, 'Register with email, password, and a display name.'],
          ['POST', <InlineCode>/api/auth/sign-in/email</InlineCode>, 'Sign in with email and password.'],
          ['POST', <InlineCode>/api/auth/sign-out</InlineCode>, 'End the current session.'],
          ['POST', <InlineCode>/api/auth/sign-in/social</InlineCode>, 'Start a Google or GitHub OAuth flow (if configured).'],
          ['POST', <InlineCode>/api/auth/change-password</InlineCode>, 'Change the current password.'],
          ['POST', <InlineCode>/api/auth/delete-user</InlineCode>, "Delete the caller's account."],
        ]}
      />

      <DocHeading id="snippets">Snippets</DocHeading>
      <DocTable
        headers={['Method', 'Endpoint', 'Description']}
        rows={[
          ['GET', <InlineCode>/api/snippets</InlineCode>, 'List your snippets, newest first. Accepts an optional ?q= search parameter.'],
          ['POST', <InlineCode>/api/snippets</InlineCode>, 'Create a snippet.'],
          ['GET', <InlineCode>/api/snippets/:id</InlineCode>, 'Get one snippet.'],
          ['PATCH', <InlineCode>/api/snippets/:id</InlineCode>, 'Update a snippet.'],
          ['DELETE', <InlineCode>/api/snippets/:id</InlineCode>, 'Delete a snippet.'],
        ]}
      />

      <DocHeading id="versions">Versions</DocHeading>
      <DocTable
        headers={['Method', 'Endpoint', 'Description']}
        rows={[
          ['GET', <InlineCode>/api/snippets/:id/versions</InlineCode>, 'List saved versions for a snippet.'],
          ['GET', <InlineCode>/api/snippets/:id/versions/:versionId</InlineCode>, 'Get one version, including its code.'],
          ['DELETE', <InlineCode>/api/snippets/:id/versions/:versionId</InlineCode>, 'Delete a version.'],
          ['POST', <InlineCode>/api/snippets/:id/versions/:versionId/restore</InlineCode>, "Restore a snippet's code to this version."],
        ]}
      />

      <DocHeading id="projects">Projects</DocHeading>
      <DocTable
        headers={['Method', 'Endpoint', 'Description']}
        rows={[
          ['GET', <InlineCode>/api/projects</InlineCode>, 'List your projects with a snippet count.'],
          ['POST', <InlineCode>/api/projects</InlineCode>, 'Create a project.'],
          ['PATCH', <InlineCode>/api/projects/:id</InlineCode>, 'Rename or update a project.'],
          ['DELETE', <InlineCode>/api/projects/:id</InlineCode>, 'Delete a project.'],
          ['PATCH', <InlineCode>/api/projects/:id/snippets/:snippetId</InlineCode>, 'Assign a snippet to this project.'],
        ]}
      />

      <DocHeading id="tags">Tags</DocHeading>
      <DocTable
        headers={['Method', 'Endpoint', 'Description']}
        rows={[
          ['GET', <InlineCode>/api/tags</InlineCode>, 'List all tags (global, not scoped to you).'],
          ['POST', <InlineCode>/api/tags</InlineCode>, 'Create a tag (409 if the name already exists).'],
          ['GET', <InlineCode>/api/tags/:id</InlineCode>, 'Get one tag.'],
          ['GET', <InlineCode>/api/tags/:id/snippets</InlineCode>, 'List your snippets carrying this tag.'],
          ['POST', <InlineCode>/api/tags/:id/snippets/:snippetId</InlineCode>, 'Attach a tag to one of your snippets.'],
          ['DELETE', <InlineCode>/api/tags/:id/snippets/:snippetId</InlineCode>, 'Detach a tag from one of your snippets.'],
        ]}
      />

      <DocHeading id="comments">Comments</DocHeading>
      <DocTable
        headers={['Method', 'Endpoint', 'Description']}
        rows={[
          ['GET', <InlineCode>/api/snippets/:snippetId/comments</InlineCode>, 'List comments on a snippet you own.'],
          ['POST', <InlineCode>/api/snippets/:snippetId/comments</InlineCode>, 'Add a comment to a snippet you own.'],
          ['PATCH', <InlineCode>/api/comments/:id</InlineCode>, 'Update one of your own comments.'],
          ['DELETE', <InlineCode>/api/comments/:id</InlineCode>, 'Delete one of your own comments.'],
        ]}
      />

      <DocHeading id="profile">Profile</DocHeading>
      <DocTable
        headers={['Method', 'Endpoint', 'Description']}
        rows={[
          ['GET', <InlineCode>/api/profile</InlineCode>, 'Get the current user profile.'],
          ['PATCH', <InlineCode>/api/profile</InlineCode>, 'Update username, display name, bio, or email.'],
          ['DELETE', <InlineCode>/api/profile</InlineCode>, "Delete the app-side user row (pair with /api/auth/delete-user)."],
        ]}
      />

      <DocHeading id="sharing">Sharing</DocHeading>
      <DocTable
        headers={['Method', 'Endpoint', 'Description']}
        rows={[
          ['GET', <InlineCode>/api/share/:token</InlineCode>, 'Public, unauthenticated. Returns a snippet only if it is public and the token matches.'],
        ]}
      />
    </div>
  )
}
