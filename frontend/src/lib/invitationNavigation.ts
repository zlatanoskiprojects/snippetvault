export function getLoginDestination(returnTo: string | null | undefined): string {
  if (returnTo?.length === '/invitations/'.length + 64 && /^\/invitations\/[0-9a-f]{64}$/.test(returnTo)) {
    return returnTo
  }
  return '/dashboard'
}
