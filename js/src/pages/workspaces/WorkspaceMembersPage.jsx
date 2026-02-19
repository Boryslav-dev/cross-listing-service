import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  inviteWorkspaceMember,
  listWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from '../../api/workspaces'
import { useWorkspace } from '../../workspaces/useWorkspace'
import { buildFormErrorMessage } from '../../utils/apiErrors'
import { useI18n } from '../../i18n/useI18n'
import {
  Alert, Button, Card, ConfirmDialog, Dialog, IconButton, Input, Select, Pagination,
  Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell,
} from '../../components/ui'
import { PersonAddIcon, TrashIcon } from '../../components/icons'
import {
  ROLE_OWNER,
  ROLE_ADMIN,
  ROLE_MANAGER,
  ROLE_CONTENT,
  ROLE_VIEWER,
  getInviteRoles,
  getUpdateRoles,
} from '../../constants/roles'

export function WorkspaceMembersPage() {
  const queryClient = useQueryClient()
  const { t } = useI18n()

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [openInviteDialog, setOpenInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState(ROLE_VIEWER)
  const [inviteError, setInviteError] = useState('')
  const [forbiddenError, setForbiddenError] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null })

  const { currentWorkspace, hasPermission } = useWorkspace()
  const workspaceId = currentWorkspace?.id

  const canInviteMembers = useMemo(
    () => hasPermission('workspace.manage_members') || hasPermission('workspace.invite_members'),
    [hasPermission],
  )

  const canChangeRoles = useMemo(
    () => hasPermission('workspace.manage_members'),
    [hasPermission],
  )

  const canRemoveMembers = useMemo(
    () => hasPermission('workspace.manage_members'),
    [hasPermission],
  )

  const inviteRoleOptions = useMemo(() => {
    return getInviteRoles(currentWorkspace?.current_role)
  }, [currentWorkspace?.current_role])

  const updateRoleOptions = useMemo(() => {
    return getUpdateRoles(currentWorkspace?.current_role)
  }, [currentWorkspace?.current_role])

  const effectiveInviteRole = inviteRoleOptions.includes(inviteRole)
    ? inviteRole
    : (inviteRoleOptions[0] ?? ROLE_VIEWER)

  const membersQuery = useQuery({
    queryKey: ['workspace-members', workspaceId, page, rowsPerPage],
    queryFn: async () => {
      return await listWorkspaceMembers(workspaceId, {
        page: page + 1,
        per_page: rowsPerPage,
      })
    },
    enabled: Number.isFinite(workspaceId) && workspaceId > 0,
  })

  const inviteMutation = useMutation({
    mutationFn: (payload) => inviteWorkspaceMember(workspaceId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
      toast.success(t('toasts.member_invited'))
      setOpenInviteDialog(false)
      setInviteEmail('')
      setInviteRole(ROLE_VIEWER)
      setInviteError('')
    },
    onError: (error) => {
      if (error?.response?.status === 403) {
        setForbiddenError(t('errors.forbidden'))
      }
      setInviteError(buildFormErrorMessage(error, t))
    },
  })

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }) => updateWorkspaceMemberRole(workspaceId, memberId, { role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
      toast.success(t('toasts.member_role_updated'))
    },
    onError: (error) => {
      if (error?.response?.status === 403) {
        setForbiddenError(t('errors.forbidden'))
        return
      }
      toast.error(buildFormErrorMessage(error, t))
    },
  })

  const removeMutation = useMutation({
    mutationFn: (memberId) => removeWorkspaceMember(workspaceId, memberId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
      toast.success(t('toasts.member_removed'))
    },
    onError: (error) => {
      if (error?.response?.status === 403) {
        setForbiddenError(t('errors.forbidden'))
        return
      }
      toast.error(buildFormErrorMessage(error, t))
    },
  })

  const members = membersQuery.data?.data ?? []
  const total = membersQuery.data?.meta?.total ?? 0

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

  if (!workspaceId) {
    return <Alert variant="warning">{t('workspace.select_workspace_prompt')}</Alert>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold leading-tight">{t('workspace.members_title')}</h2>
          <p className="text-xs text-text-secondary">
            {currentWorkspace?.name ?? t('workspace.members_subtitle')}
          </p>
        </div>
        {canInviteMembers && (
          <Button
            size="sm"
            startIcon={<PersonAddIcon size={16} />}
            onClick={() => setOpenInviteDialog(true)}
          >
            {t('workspace.invite_button')}
          </Button>
        )}
      </div>

      <Alert variant="info">
        {t('workspace.role_hints_title')}: {t('workspace.role_hints')}
      </Alert>

      {!canInviteMembers && !canChangeRoles && !canRemoveMembers && (
        <Alert variant="info">{t('workspace.members_read_only')}</Alert>
      )}
      {forbiddenError && <Alert variant="error">{forbiddenError}</Alert>}

      <Card padding={false}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t('workspace.member_name')}</TableHeaderCell>
              <TableHeaderCell>{t('workspace.member_email')}</TableHeaderCell>
              <TableHeaderCell>{t('workspace.member_role')}</TableHeaderCell>
              <TableHeaderCell>{t('workspace.member_status')}</TableHeaderCell>
              <TableHeaderCell align="right">{t('workspace.table_action')}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="py-4 text-sm text-text-secondary">
                    {membersQuery.isLoading ? t('common.loading') : t('workspace.members_empty')}
                  </p>
                </TableCell>
              </TableRow>
            )}

            {members.map((member) => {
              const memberName = member.user?.name || t('workspace.no_name')
              const memberEmail = member.user?.email || member.invited_email || '-'
              const isOwnerProtectedForAdmin =
                currentWorkspace?.current_role === ROLE_ADMIN && member.role === ROLE_OWNER
              const canEditThisMemberRole = canChangeRoles && !isOwnerProtectedForAdmin
              const canRemoveThisMember = canRemoveMembers && !isOwnerProtectedForAdmin

              return (
                <TableRow key={member.id} hover>
                  <TableCell>{memberName}</TableCell>
                  <TableCell>{memberEmail}</TableCell>
                  <TableCell>
                    {canEditThisMemberRole ? (
                      <Select
                        size="sm"
                        value={member.role}
                        onChange={(nextRole) => {
                          setConfirmDialog({
                            open: true,
                            title: t('workspace.confirm_role_change'),
                            message: '',
                            onConfirm: () => roleMutation.mutate({ memberId: member.id, role: nextRole }),
                          })
                        }}
                        options={updateRoleOptions.map((role) => ({
                          value: role,
                          label: roleLabelMap[role] ?? role,
                        }))}
                      />
                    ) : (
                      roleLabelMap[member.role] || member.role
                    )}
                  </TableCell>
                  <TableCell>{member.status_label || member.status}</TableCell>
                  <TableCell align="right">
                    {canRemoveThisMember && (
                      <IconButton
                        size="sm"
                        title={t('workspace.remove_button')}
                        className="text-danger hover:bg-danger/10 hover:text-danger"
                        onClick={() => {
                          setConfirmDialog({
                            open: true,
                            title: t('workspace.confirm_member_remove'),
                            message: '',
                            onConfirm: () => removeMutation.mutate(member.id),
                          })
                        }}
                      >
                        <TrashIcon size={16} />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        <Pagination
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(nextRowsPerPage) => {
            setRowsPerPage(nextRowsPerPage)
            setPage(0)
          }}
        />
      </Card>

      <Dialog
        open={openInviteDialog}
        onClose={() => setOpenInviteDialog(false)}
        maxWidth="xs"
        title={t('workspace.invite_title')}
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpenInviteDialog(false)}>
              {t('workspace.cancel')}
            </Button>
            <Button
              disabled={!inviteEmail || inviteMutation.isPending}
              onClick={() => {
                inviteMutation.mutate({
                  email: inviteEmail,
                  role: effectiveInviteRole,
                })
              }}
            >
              {inviteMutation.isPending ? t('buttons.loading') : t('workspace.send_invite')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 mt-1">
          {inviteError && <Alert variant="error">{inviteError}</Alert>}
          <Input
            type="email"
            label={t('workspace.invite_email')}
            size="sm"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Select
            size="sm"
            value={effectiveInviteRole}
            onChange={(val) => setInviteRole(val)}
            options={inviteRoleOptions.map((role) => ({
              value: role,
              label: roleLabelMap[role] ?? role,
            }))}
          />
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm ?? (() => {})}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={t('workspace.confirm')}
        cancelLabel={t('workspace.cancel')}
      />
    </div>
  )
}
