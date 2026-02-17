import http from './http'

export async function listWorkspaces(params = {}) {
  const { data } = await http.get('/api/v1/workspaces', { params })

  return data
}

export async function createWorkspace(payload) {
  const { data } = await http.post('/api/v1/workspaces', payload)

  return data
}

export async function getWorkspace(workspaceId) {
  const { data } = await http.get(`/api/v1/workspaces/${workspaceId}`)

  return data
}

export async function updateWorkspace(workspaceId, payload) {
  const { data } = await http.patch(`/api/v1/workspaces/${workspaceId}`, payload)

  return data
}

export async function listWorkspaceMembers(workspaceId, params = {}) {
  const { data } = await http.get(`/api/v1/workspaces/${workspaceId}/members`, { params })

  return data
}

export async function inviteWorkspaceMember(workspaceId, payload) {
  const { data } = await http.post(`/api/v1/workspaces/${workspaceId}/members/invite`, payload)

  return data
}

export async function updateWorkspaceMemberRole(workspaceId, memberId, payload) {
  const { data } = await http.patch(`/api/v1/workspaces/${workspaceId}/members/${memberId}`, payload)

  return data
}

export async function removeWorkspaceMember(workspaceId, memberId) {
  const { data } = await http.delete(`/api/v1/workspaces/${workspaceId}/members/${memberId}`)

  return data
}

export async function listWorkspaceAuditLogs(workspaceId, params = {}) {
  const { data } = await http.get(`/api/v1/workspaces/${workspaceId}/audit-logs`, { params })

  return data
}