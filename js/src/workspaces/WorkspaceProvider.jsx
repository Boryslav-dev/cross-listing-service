import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listWorkspaces } from '../api/workspaces'
import { WorkspaceContext } from './WorkspaceContext'

const STORAGE_KEY = 'current_workspace_id'

function normalizeWorkspaceId(value) {
  if (value === null || value === undefined) {
    return null
  }

  const asNumber = Number(value)

  return Number.isFinite(asNumber) && asNumber > 0 ? asNumber : null
}

export function WorkspaceProvider({ children }) {
  const queryClient = useQueryClient()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(() => {
    if (typeof window === 'undefined') {
      return null
    }

    return normalizeWorkspaceId(window.localStorage.getItem(STORAGE_KEY))
  })

  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const response = await listWorkspaces()

      return response
    },
    staleTime: 10_000,
  })

  const workspaces = useMemo(() => {
    const list = workspacesQuery.data?.data

    return Array.isArray(list) ? list : []
  }, [workspacesQuery.data])

  const currentWorkspaceId = useMemo(() => {
    if (workspaces.length === 0) {
      return null
    }

    const hasSelectedWorkspace = workspaces.some((workspace) => workspace.id === selectedWorkspaceId)

    if (hasSelectedWorkspace) {
      return selectedWorkspaceId
    }

    return workspaces[0]?.id ?? null
  }, [selectedWorkspaceId, workspaces])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (!currentWorkspaceId) {
      window.localStorage.removeItem(STORAGE_KEY)

      return
    }

    window.localStorage.setItem(STORAGE_KEY, String(currentWorkspaceId))
  }, [currentWorkspaceId])

  const setCurrentWorkspaceId = useCallback((nextId) => {
    const normalizedId = normalizeWorkspaceId(nextId)
    setSelectedWorkspaceId(normalizedId)
  }, [])

  const refreshWorkspaces = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
  }, [queryClient])

  const currentWorkspace = useMemo(() => {
    if (!currentWorkspaceId) {
      return null
    }

    return workspaces.find((workspace) => workspace.id === currentWorkspaceId) ?? null
  }, [currentWorkspaceId, workspaces])

  const hasPermission = useCallback(
    (permission, workspace = null) => {
      const targetWorkspace = workspace ?? currentWorkspace

      if (!targetWorkspace || !Array.isArray(targetWorkspace.permissions)) {
        return false
      }

      return targetWorkspace.permissions.includes(permission)
    },
    [currentWorkspace],
  )

  const value = useMemo(
    () => ({
      workspaces,
      currentWorkspace,
      currentWorkspaceId,
      setCurrentWorkspaceId,
      hasPermission,
      refreshWorkspaces,
      isLoading: workspacesQuery.isLoading,
      isFetching: workspacesQuery.isFetching,
      error: workspacesQuery.error,
    }),
    [
      workspaces,
      currentWorkspace,
      currentWorkspaceId,
      setCurrentWorkspaceId,
      hasPermission,
      refreshWorkspaces,
      workspacesQuery.isLoading,
      workspacesQuery.isFetching,
      workspacesQuery.error,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
