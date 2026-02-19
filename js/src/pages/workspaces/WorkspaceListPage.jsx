import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createWorkspace } from '../../api/workspaces'
import { useWorkspace } from '../../workspaces/useWorkspace'
import { buildFormErrorMessage } from '../../utils/apiErrors'
import { useI18n } from '../../i18n/useI18n'
import {
  Alert, Badge, Button, Card, Dialog, IconButton, Input,
  Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell,
} from '../../components/ui'
import { AddIcon, GridIcon, ListIcon, OpenInNewIcon } from '../../components/icons'
import {
  ROLE_OWNER,
  ROLE_ADMIN,
  ROLE_MANAGER,
  ROLE_CONTENT,
  ROLE_VIEWER,
} from '../../constants/roles'

export function WorkspaceListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, locale } = useI18n()
  const { workspaces, setCurrentWorkspaceId, isLoading } = useWorkspace()

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('workspace_list_view') || 'grid'
  })
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    localStorage.setItem('workspace_list_view', viewMode)
  }, [viewMode])

  const createMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: async (response) => {
      const workspaceId = response?.workspace?.id
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      if (workspaceId) {
        setCurrentWorkspaceId(workspaceId)
      }
      setOpenCreateDialog(false)
      setName('')
      setSlug('')
      setFormError('')
      toast.success(t('toasts.workspace_created'))
    },
    onError: (error) => {
      setFormError(buildFormErrorMessage(error, t))
    },
  })

  // Fallback role labels if backend doesn't provide translated labels
  const roleLabelMap = useMemo(
    () => ({
      [ROLE_OWNER]: t('workspace.roles.owner'),
      [ROLE_ADMIN]: t('workspace.roles.admin'),
      [ROLE_MANAGER]: t('workspace.roles.manager'),
      [ROLE_CONTENT]: t('workspace.roles.content'),
      [ROLE_VIEWER]: t('workspace.roles.viewer'),
    }),
    [t],
  )

  const handleCreateWorkspace = async () => {
    setFormError('')
    await createMutation.mutateAsync({
      name,
      slug: slug || null,
    })
  }

  const handleOpenWorkspace = (workspaceId) => {
    setCurrentWorkspaceId(workspaceId)
    navigate('/app/members')
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatMembersCount = (count) => {
    // English: 1 member, 2+ members
    // Ukrainian: 1 учасник, 2-4 учасника, 5+ учасників
    if (count === 1) {
      return t('workspace.card_members_count_one')
    }

    // For Ukrainian locale, handle special pluralization
    if (locale === 'uk') {
      const lastDigit = count % 10
      const lastTwoDigits = count % 100

      if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
        return t('workspace.card_members_count_few', { count })
      }
    }

    return t('workspace.card_members_count', { count })
  }

  if (isLoading) {
    return <p className="text-sm">{t('common.loading')}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold leading-tight">{t('workspace.list_title')}</h2>
          <p className="text-xs text-text-secondary">{t('workspace.list_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-border p-1">
            <IconButton
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-primary/10 text-primary' : ''}
              title={t('workspace.view_mode_grid')}
            >
              <GridIcon size={16} />
            </IconButton>
            <IconButton
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-primary/10 text-primary' : ''}
              title={t('workspace.view_mode_list')}
            >
              <ListIcon size={16} />
            </IconButton>
          </div>
          <Button
            size="sm"
            startIcon={<AddIcon size={16} />}
            onClick={() => setOpenCreateDialog(true)}
          >
            {t('workspace.create_button')}
          </Button>
        </div>
      </div>

      {workspaces.length === 0 ? (
        <Card>
          <div className="p-7">
            <p className="font-semibold">{t('workspace.empty_title')}</p>
            <p className="mt-1 text-sm text-text-secondary">{t('workspace.empty_subtitle')}</p>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => {
            const translatedRole = roleLabelMap[workspace.current_role] || workspace.current_role
            const avatarLetter = workspace.name.charAt(0).toUpperCase()
            const membersCount = workspace.members_count ?? 0
            const lastActive = formatDate(workspace.updated_at)

            return (
              <Card
                key={workspace.id}
                className="cursor-pointer transition-all hover:border-primary hover:shadow-sm"
                onClick={() => handleOpenWorkspace(workspace.id)}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
                      {avatarLetter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold">{workspace.name}</h3>
                      {workspace.slug && (
                        <p className="truncate text-xs text-text-secondary">@{workspace.slug}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
                    <div className="flex items-center justify-between">
                      <span>{formatMembersCount(membersCount)}</span>
                      <Badge size="sm">{translatedRole}</Badge>
                    </div>
                    <div>
                      {t('workspace.card_last_active', { date: lastActive })}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card padding={false}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t('workspace.table_name')}</TableHeaderCell>
                <TableHeaderCell>{t('workspace.table_slug')}</TableHeaderCell>
                <TableHeaderCell>{t('workspace.table_role')}</TableHeaderCell>
                <TableHeaderCell>{t('workspace.table_members')}</TableHeaderCell>
                <TableHeaderCell>{t('workspace.table_last_active')}</TableHeaderCell>
                <TableHeaderCell align="right">{t('workspace.table_action')}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspaces.map((workspace) => {
                const translatedRole = roleLabelMap[workspace.current_role] || workspace.current_role
                const membersCount = workspace.members_count ?? 0
                const lastActive = formatDate(workspace.updated_at)

                return (
                  <TableRow key={workspace.id} hover className="cursor-pointer" onClick={() => handleOpenWorkspace(workspace.id)}>
                    <TableCell>
                      <span className="text-sm font-semibold">{workspace.name}</span>
                    </TableCell>
                    <TableCell>
                      {workspace.slug ? (
                        <span className="text-xs text-text-secondary">@{workspace.slug}</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge size="sm">{translatedRole}</Badge>
                    </TableCell>
                    <TableCell>{membersCount}</TableCell>
                    <TableCell>
                      <span className="text-xs text-text-secondary">{lastActive}</span>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        endIcon={<OpenInNewIcon size={14} />}
                        onClick={() => handleOpenWorkspace(workspace.id)}
                      >
                        {t('workspace.open_button')}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="xs"
        title={t('workspace.create_dialog_title')}
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpenCreateDialog(false)}>
              {t('workspace.cancel')}
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              disabled={!name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? t('buttons.loading') : t('workspace.create_confirm')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 mt-1">
          {formError && <Alert variant="error">{formError}</Alert>}
          <Input
            label={t('workspace.form_name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="sm"
            autoFocus
            required
          />
          <Input
            label={t('workspace.form_slug')}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            size="sm"
          />
        </div>
      </Dialog>
    </div>
  )
}
