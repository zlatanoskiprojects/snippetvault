# SnippetVault

SnippetVault lets user accounts keep and share code snippets.

## Language

**Avatar**:
The visual identity shown for a user account. Each account has a generated avatar by default and may use an uploaded profile photo instead.

**Generated avatar**:
The stable default avatar assigned to a user account.

**Profile photo**:
An image uploaded by a user to replace that account's generated avatar.

**Provider photo**:
An image supplied by a linked sign-in provider. It does not determine the account's SnippetVault avatar.

**Workspace**:
A shared space where members keep snippets and projects together. Every snippet and project belongs to exactly one workspace.
_Avoid_: Team, organization, space

**Workspace owner**:
The single member of a workspace with full control over it, including renaming, deleting and managing members. Every workspace has exactly one.
_Avoid_: Admin, creator

**Ownership transfer**:
The workspace owner handing ownership to another member, after which the former owner becomes an editor. Only members can receive ownership; someone with a pending invitation cannot.
_Avoid_: Handover

**Workspace settings**:
The owner-only place where a workspace's name, ownership and deletion are managed.
_Avoid_: General settings, workspace preferences

**Member**:
A user who has joined a workspace, with the role of owner, editor or viewer. Someone with a pending invitation is not a member until they accept it.
_Avoid_: Collaborator, participant
