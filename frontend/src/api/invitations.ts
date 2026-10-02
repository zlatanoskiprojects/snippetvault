import { apiFetch } from './utils'
import type { WorkspaceRole } from './types'

export interface Invitation {
  id: number
  workspace_id: number
  workspace_name: string
  inviter_name: string | null
  role: Exclude<WorkspaceRole, 'owner'>
  created_at: string
  expires_at: string
}

export function getInvitations(): Promise<Invitation[]> {
  return apiFetch<Invitation[]>(`${import.meta.env.VITE_API_URL}/invitations`, { silent: true })
}

export function acceptInvitation(invitationId: number): Promise<{message:string}> {
  return apiFetch<{message:string}>(`${import.meta.env.VITE_API_URL}/invitations/${invitationId}/accept`, {
    method: 'POST',
    silent: true,
  })
}

export function declineInvitation(invitationId: number): Promise<{message:string}> {
  return apiFetch<{message:string}>(`${import.meta.env.VITE_API_URL}/invitations/${invitationId}/decline`, {
    method: 'POST',
    silent: true,
  })
}
