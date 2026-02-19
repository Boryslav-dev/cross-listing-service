import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listWorkspaceAuditLogs } from '../../api/workspaces'
import { useWorkspace } from '../../workspaces/useWorkspace'
import { useI18n } from '../../i18n/useI18n'
import {
  Alert, Card, Input, IconButton, Collapse, Pagination,
  Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell,
} from '../../components/ui'
import { ExpandMoreIcon, ExpandLessIcon, ResetIcon } from '../../components/icons'

export function WorkspaceAuditPage() {
  const { t } = useI18n()
  const { currentWorkspace, hasPermission } = useWorkspace()
  const workspaceId = currentWorkspace?.id

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [filters, setFilters] = useState({
    action: '',
    actor_user_id: '',
    target_type: '',
    date_from: '',
    date_to: '',
  })
  const [expandedRows, setExpandedRows] = useState(() => new Set())

  const canViewAudit = hasPermission('audit.view')

  const queryParams = useMemo(
    () => ({
      ...Object.fromEntries(
        Object.entries(filters).filter(([, value]) => String(value).trim() !== ''),
      ),
      page: page + 1,
      per_page: rowsPerPage,
    }),
    [filters, page, rowsPerPage],
  )

  const auditQuery = useQuery({
    queryKey: ['workspace-audit', workspaceId, queryParams],
    queryFn: async () => {
      return await listWorkspaceAuditLogs(workspaceId, queryParams)
    },
    enabled: workspaceId > 0 && canViewAudit,
  })

  if (!workspaceId) {
    return <Alert variant="warning">{t('workspace.select_workspace_prompt')}</Alert>
  }

  if (!canViewAudit) {
    return <Alert variant="error">{t('errors.forbidden')}</Alert>
  }

  const records = auditQuery.data?.data ?? []
  const total = auditQuery.data?.meta?.total ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold leading-tight">{t('workspace.audit_title')}</h2>
          <p className="text-xs text-text-secondary">
            {currentWorkspace?.name ?? t('workspace.audit_subtitle')}
          </p>
        </div>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            size="sm"
            label={t('workspace.filter_action')}
            value={filters.action}
            onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
          />
          <Input
            size="sm"
            label={t('workspace.filter_actor')}
            value={filters.actor_user_id}
            onChange={(e) => setFilters((prev) => ({ ...prev, actor_user_id: e.target.value }))}
          />
          <Input
            size="sm"
            label={t('workspace.filter_target')}
            value={filters.target_type}
            onChange={(e) => setFilters((prev) => ({ ...prev, target_type: e.target.value }))}
          />
          <Input
            size="sm"
            type="date"
            label={t('workspace.filter_date_from')}
            value={filters.date_from}
            onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))}
          />
          <Input
            size="sm"
            type="date"
            label={t('workspace.filter_date_to')}
            value={filters.date_to}
            onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))}
          />
          <div className="flex items-end">
            <IconButton
              title={t('workspace.filters_reset')}
              onClick={() => {
                setFilters({
                  action: '',
                  actor_user_id: '',
                  target_type: '',
                  date_from: '',
                  date_to: '',
                })
                setPage(0)
              }}
            >
              <ResetIcon size={18} />
            </IconButton>
          </div>
        </div>
      </Card>

      <Card padding={false}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t('workspace.audit_date')}</TableHeaderCell>
              <TableHeaderCell>{t('workspace.audit_actor')}</TableHeaderCell>
              <TableHeaderCell>{t('workspace.audit_action')}</TableHeaderCell>
              <TableHeaderCell>{t('workspace.audit_target')}</TableHeaderCell>
              <TableHeaderCell>{t('workspace.audit_meta')}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="py-4 text-sm text-text-secondary">
                    {auditQuery.isLoading ? t('common.loading') : t('workspace.audit_empty')}
                  </p>
                </TableCell>
              </TableRow>
            )}

            {records.map((record) => {
              const rowOpen = expandedRows.has(record.id)

              return (
                <TableRow key={record.id} hover>
                  <TableCell>{record.created_at ?? '-'}</TableCell>
                  <TableCell>{record.actor?.email ?? '-'}</TableCell>
                  <TableCell>{record.action}</TableCell>
                  <TableCell>
                    {record.target_type
                      ? `${record.target_type}:${record.target_id ?? '-'}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="sm"
                      onClick={() => {
                        setExpandedRows((prev) => {
                          const next = new Set(prev)
                          if (next.has(record.id)) {
                            next.delete(record.id)
                          } else {
                            next.add(record.id)
                          }
                          return next
                        })
                      }}
                    >
                      {rowOpen ? (
                        <ExpandLessIcon size={16} />
                      ) : (
                        <ExpandMoreIcon size={16} />
                      )}
                    </IconButton>

                    <Collapse open={rowOpen}>
                      <pre className="mt-1 p-2.5 bg-gray-50 rounded-md text-[11px] max-w-[320px] overflow-x-auto">
                        {JSON.stringify(record.meta ?? {}, null, 2)}
                      </pre>
                    </Collapse>
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
    </div>
  )
}
