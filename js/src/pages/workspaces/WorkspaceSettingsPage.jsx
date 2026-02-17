import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { updateWorkspace, deleteWorkspace } from '../../api/workspaces'
import { useWorkspace } from '../../workspaces/useWorkspace'
import { buildFormErrorMessage } from '../../utils/apiErrors'
import { useI18n } from '../../i18n/useI18n'
import { Alert, Button, Card, DeleteConfirmDialog, Divider, Input } from '../../components/ui'
import { TrashIcon } from '../../components/icons'
import { ROLE_OWNER } from '../../constants/roles'

export function WorkspaceSettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspace()
  const workspaceId = currentWorkspace?.id

  const [name, setName] = useState(currentWorkspace?.name || '')
  const [slug, setSlug] = useState(currentWorkspace?.slug || '')
  const [updateError, setUpdateError] = useState('')
  const [deleteDialog, setDeleteDialog] = useState(false)

  const isOwner = currentWorkspace?.current_role === ROLE_OWNER

  const updateMutation = useMutation({
    mutationFn: (payload) => updateWorkspace(workspaceId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      toast.success(t('toasts.workspace_updated'))
      setUpdateError('')
    },
    onError: (error) => {
      setUpdateError(buildFormErrorMessage(error, t))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteWorkspace(workspaceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      localStorage.removeItem('current_workspace_id')
      toast.success(t('toasts.workspace_deleted'))
      navigate('/app/workspaces')
    },
    onError: (error) => {
      toast.error(buildFormErrorMessage(error, t))
    },
  })

  const handleUpdate = (e) => {
    e.preventDefault()
    updateMutation.mutate({ name, slug })
  }

  const handleDelete = () => {
    deleteMutation.mutate()
    setDeleteDialog(false)
  }

  if (!workspaceId) {
    return <Alert variant="warning">{t('workspace.select_workspace_prompt')}</Alert>
  }

  if (!isOwner) {
    return <Alert variant="error">{t('workspace.settings_permission_denied')}</Alert>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold leading-tight">{t('workspace.settings_title')}</h2>
        <p className="text-xs text-text-secondary">{t('workspace.settings_subtitle')}</p>
      </div>

      <Card>
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <h3 className="text-base font-semibold">{t('workspace.settings_general')}</h3>
          {updateError && <Alert variant="error">{updateError}</Alert>}
          <Input
            label={t('workspace.settings_name_label')}
            size="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label={t('workspace.settings_slug_label')}
            size="sm"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" isLoading={updateMutation.isPending}>
              {t('workspace.settings_save_button')}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-danger">{t('workspace.settings_danger_zone')}</h3>
          <Divider />
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-sm font-medium">{t('workspace.settings_delete_title')}</h4>
              <p className="text-xs text-text-secondary mt-1">
                {t('workspace.settings_delete_description')}
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              startIcon={<TrashIcon size={16} />}
              onClick={() => setDeleteDialog(true)}
            >
              {t('workspace.settings_delete_button')}
            </Button>
          </div>
        </div>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        title={t('workspace.delete_confirm_title')}
        message={t('workspace.delete_confirm_message')}
        requiredText={currentWorkspace?.name || ''}
        placeholder={t('workspace.delete_confirm_placeholder')}
        helperText={t('workspace.delete_confirm_helper', { name: currentWorkspace?.name || '' })}
        confirmLabel={t('workspace.settings_delete_button')}
        cancelLabel={t('workspace.cancel')}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
