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
