# SnippetVault

SnippetVault lets people keep and share code snippets in workspaces.

## Language

**Workspace**:
A shared space for members and their snippets. Projects belong to a workspace.

**Project**:
An optional grouping of related snippets within a workspace. A snippet can belong to one project at a time.
_Avoid_: Collection

**Snippet**:
A saved piece of code with a title and language, kept in a workspace.

**Avatar**:
The visual identity shown for a user account. Each account has a generated avatar by default and may use an uploaded profile photo instead.

**Generated avatar**:
The stable default avatar assigned to a user account.

**Profile photo**:
An image uploaded by a user to replace that account's generated avatar.

**Provider photo**:
An image supplied by a linked sign-in provider. It does not determine the account's SnippetVault avatar.

**Member**:
A user who belongs to a workspace and holds exactly one role in it.
_Avoid_: Collaborator

**Role**:
What a member may do in a workspace: owner, editor, or viewer. Each workspace has exactly one owner.

**Invitation**:
An offer, sent to an email address, to join a workspace with the editor or viewer role. The invitee accepts or declines it.
_Avoid_: Reject

**Share link**:
The public URL through which one snippet can be read without signing in. Workspace membership does not make a snippet public.
_Avoid_: Share token

**Tag**:
A short label attached to a snippet, used to find it. Tag names are shared across the installation.

**Version**:
An earlier copy of a snippet's code, saved when the code changes. A version can be restored.
_Avoid_: Revision

**Change note**:
An optional short message describing why a snippet's code was changed, shown with the version it produces.

**Visibility**:
Whether a snippet is private (members only) or public (readable through its share link).

**Comment**:
A short message on a snippet, visible to the members of its workspace.
