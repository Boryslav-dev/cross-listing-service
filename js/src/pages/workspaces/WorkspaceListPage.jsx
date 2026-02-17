import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createWorkspace } from '../../api/workspaces'
import { useWorkspace } from '../../workspaces/useWorkspace'
import { buildFormErrorMessage } from '../../utils/apiErrors'
import { useI18n } from '../../i18n/useI18n'
import {
  Alert, Button, Card, Dialog, Input,
  Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell,
} from '../../components/ui'
import { AddIcon, OpenInNewIcon } from '../../components/icons'

export function WorkspaceListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const { workspaces, setCurrentWorkspaceId, isLoading } = useWorkspace()

  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [formError, setFormError] = useState('')

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

  const roleLabelMap = useMemo(
    () => ({
      owner: t('workspace.roles.owner'),
      admin: t('workspace.roles.admin'),
      manager: t('workspace.roles.manager'),
      content: t('workspace.roles.content'),
      viewer: t('workspace.roles.viewer'),
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
        <Button
          size="sm"
          startIcon={<AddIcon size={16} />}
          onClick={() => setOpenCreateDialog(true)}
        >
          {t('workspace.create_button')}
        </Button>
      </div>

      <Card padding={false}>
        {workspaces.length === 0 ? (
          <div className="p-7">
            <p className="font-semibold">{t('workspace.empty_title')}</p>
            <p className="mt-1 text-sm text-text-secondary">{t('workspace.empty_subtitle')}</p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t('workspace.table_name')}</TableHeaderCell>
                <TableHeaderCell>{t('workspace.table_role')}</TableHeaderCell>
                <TableHeaderCell>{t('workspace.table_members')}</TableHeaderCell>
                <TableHeaderCell align="right">{t('workspace.table_action')}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspaces.map((workspace) => {
                const translatedRole = roleLabelMap[workspace.current_role] ?? workspace.current_role

                return (
                  <TableRow key={workspace.id} hover>
                    <TableCell>
                      <span className="text-sm font-semibold">{workspace.name}</span>
                      {workspace.slug && (
                        <span className="block text-xs text-text-secondary">{workspace.slug}</span>
                      )}
                    </TableCell>
                    <TableCell>{translatedRole}</TableCell>
                    <TableCell>{workspace.members_count ?? '-'}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outline"
                        size="sm"
                        endIcon={<OpenInNewIcon size={14} />}
                        onClick={() => {
                          setCurrentWorkspaceId(workspace.id)
                          navigate(`/app/workspaces/${workspace.id}/members`)
                        }}
                      >
                        {t('workspace.open_button')}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

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
