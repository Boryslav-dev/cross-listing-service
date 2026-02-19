import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { listProducts, deleteProduct } from '../../api/products'
import { useWorkspace } from '../../workspaces/useWorkspace'
import { buildFormErrorMessage } from '../../utils/apiErrors'
import { useI18n } from '../../i18n/useI18n'
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  IconButton,
  Input,
  Pagination,
  Select,
  Spinner,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '../../components/ui'
import {
  AddIcon,
  CopyIcon,
  EditIcon,
  GridIcon,
  Grid2x2Icon,
  Grid3x3Icon,
  ListIcon,
  SearchIcon,
  TrashIcon,
} from '../../components/icons'

const STATUS_VARIANT = { draft: 'warning', active: 'success', archived: 'default' }

export function ProductListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, locale } = useI18n()
  const { currentWorkspaceId, hasPermission } = useWorkspace()

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('product_list_view') || 'grid-medium'
  })
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState('created_at_desc')
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null })

  const canWrite = useMemo(
    () => hasPermission('products.write'),
    [hasPermission],
  )

  useEffect(() => {
    localStorage.setItem('product_list_view', viewMode)
  }, [viewMode])

  const sortBy = sort.substring(0, sort.lastIndexOf('_'))
  const sortDir = sort.substring(sort.lastIndexOf('_') + 1)

  const productsQuery = useQuery({
    queryKey: ['products', currentWorkspaceId, page, rowsPerPage, search, statusFilter, sort],
    queryFn: () =>
      listProducts(currentWorkspaceId, {
        page: page + 1,
        per_page: rowsPerPage,
        search,
        status: statusFilter,
        sort_by: sortBy,
        sort_dir: sortDir,
      }),
    enabled: Number.isFinite(currentWorkspaceId) && currentWorkspaceId > 0,
  })

  const deleteMutation = useMutation({
    mutationFn: (productId) => deleteProduct(currentWorkspaceId, productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products', currentWorkspaceId] })
      toast.success(t('toasts.product_deleted'))
    },
    onError: (error) => {
      toast.error(buildFormErrorMessage(error, t))
    },
  })

  const products = productsQuery.data?.data ?? []
  const total = productsQuery.data?.meta?.total ?? 0

  const handleDelete = (product) => {
    const translation = product.translations?.find((tr) => tr.locale === locale) || product.translations?.[0]
    setConfirmDialog({
      open: true,
      title: t('products.delete_confirm_title'),
      message: `${translation?.name || product.sku}`,
      onConfirm: () => deleteMutation.mutate(product.id),
    })
  }

  const handleEdit = (product) => {
    navigate(`/app/products/${product.id}/edit`)
  }

  const handleCopy = (product) => {
    const ukTranslation = product.translations?.find((tr) => tr.locale === 'uk') || product.translations?.[0]
    navigate('/app/products/new', {
      state: {
        copyFrom: {
          price: product.price,
          currency: product.currency,
          quantity: product.quantity,
          ukName: ukTranslation?.name ?? '',
          ukDescription: ukTranslation?.description ?? '',
          images: [],
        },
      },
    })
  }

  const handleProductClick = (productId) => {
    navigate(`/app/products/${productId}`)
  }

  const statusOptions = [
    { value: 'all', label: t('products.filter_all') },
    { value: 'draft', label: t('products.status_draft') },
    { value: 'active', label: t('products.status_active') },
    { value: 'archived', label: t('products.status_archived') },
  ]

  const sortOptions = [
    { value: 'created_at_desc', label: t('products.sort_newest') },
    { value: 'created_at_asc', label: t('products.sort_oldest') },
    { value: 'name_asc', label: t('products.sort_name_asc') },
    { value: 'name_desc', label: t('products.sort_name_desc') },
    { value: 'price_asc', label: t('products.sort_price_asc') },
    { value: 'price_desc', label: t('products.sort_price_desc') },
    { value: 'quantity_asc', label: t('products.sort_quantity_asc') },
    { value: 'quantity_desc', label: t('products.sort_quantity_desc') },
  ]

  if (!currentWorkspaceId) {
    return <Alert variant="warning">{t('workspace.select_workspace_prompt')}</Alert>
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold leading-tight">{t('products.list_title')}</h2>
          <p className="text-xs text-text-secondary">{t('products.list_subtitle')}</p>
        </div>
        {canWrite && (
          <Button size="sm" startIcon={<AddIcon size={16} />} onClick={() => navigate('/app/products/new')}>
            {t('products.create_button')}
          </Button>
        )}
      </div>

      {/* Filters and View Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-md">
            <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <Input
              placeholder={t('products.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setPage(0) }}
            options={statusOptions}
            className="w-36"
          />
          <Select
            value={sort}
            onChange={(val) => { setSort(val); setPage(0) }}
            options={sortOptions}
            className="w-44"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 rounded-md border border-border p-1">
          <IconButton
            size="sm"
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'bg-primary/10 text-primary' : ''}
            title={t('products.view_table')}
          >
            <ListIcon size={16} />
          </IconButton>
          <IconButton
            size="sm"
            onClick={() => setViewMode('grid-large')}
            className={viewMode === 'grid-large' ? 'bg-primary/10 text-primary' : ''}
            title={t('products.view_grid_large')}
          >
            <Grid2x2Icon size={16} />
          </IconButton>
          <IconButton
            size="sm"
            onClick={() => setViewMode('grid-medium')}
            className={viewMode === 'grid-medium' ? 'bg-primary/10 text-primary' : ''}
            title={t('products.view_grid_medium')}
          >
            <Grid3x3Icon size={16} />
          </IconButton>
          <IconButton
            size="sm"
            onClick={() => setViewMode('grid-small')}
            className={viewMode === 'grid-small' ? 'bg-primary/10 text-primary' : ''}
            title={t('products.view_grid_small')}
          >
            <GridIcon size={16} />
          </IconButton>
        </div>
      </div>

      {/* Content */}
      {productsQuery.isLoading ? (
        <Card>
          <div className="flex items-center justify-center p-12">
            <Spinner size="lg" />
          </div>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <div className="p-10 text-center flex flex-col items-center gap-2">
            {search || statusFilter !== 'all' ? (
              <>
                <p className="text-4xl mb-2">🔍</p>
                <p className="font-semibold">{t('products.search_empty_title')}</p>
                <p className="text-sm text-text-secondary">{t('products.search_empty_subtitle')}</p>
              </>
            ) : (
              <>
                <p className="text-4xl mb-2">📦</p>
                <p className="font-semibold">{t('products.empty_title')}</p>
                <p className="text-sm text-text-secondary">{t('products.empty_subtitle')}</p>
                {canWrite && (
                  <Button size="sm" className="mt-2" startIcon={<AddIcon size={16} />} onClick={() => navigate('/app/products/new')}>
                    {t('products.create_button')}
                  </Button>
                )}
              </>
            )}
          </div>
        </Card>
      ) : viewMode === 'table' ? (
        <Card padding={false}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t('products.table_image')}</TableHeaderCell>
                <TableHeaderCell>{t('products.table_name')}</TableHeaderCell>
                <TableHeaderCell>{t('products.table_sku')}</TableHeaderCell>
                <TableHeaderCell>{t('products.table_price')}</TableHeaderCell>
                <TableHeaderCell>{t('products.table_quantity')}</TableHeaderCell>
                <TableHeaderCell>{t('products.table_status')}</TableHeaderCell>
                <TableHeaderCell align="right">{t('products.table_action')}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => {
                const translation = product.translations?.find((tr) => tr.locale === locale) || product.translations?.[0]
                const mainImage = product.images?.[0]?.url

                return (
                  <TableRow key={product.id} hover onClick={() => handleProductClick(product.id)} className="cursor-pointer">
                    <TableCell>
                      {mainImage ? (
                        <img src={mainImage} alt={translation?.name} className="h-12 w-12 rounded object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded bg-surface-hover" />
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{translation?.name || '-'}</span>
                    </TableCell>
                    <TableCell>{product.sku || '-'}</TableCell>
                    <TableCell>
                      {product.price} {product.currency}
                    </TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>
                      <Badge size="sm" variant={STATUS_VARIANT[product.status] ?? 'default'}>{t(`products.status_${product.status}`)}</Badge>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {canWrite && (
                          <>
                            <IconButton
                              size="sm"
                              title={t('products.copy_button')}
                              onClick={() => handleCopy(product)}
                              className="hover:bg-secondary/10 hover:text-secondary"
                            >
                              <CopyIcon size={15} />
                            </IconButton>
                            <IconButton
                              size="sm"
                              title={t('products.edit_button')}
                              onClick={() => handleEdit(product)}
                              className="hover:bg-primary/10 hover:text-primary"
                            >
                              <EditIcon size={15} />
                            </IconButton>
                            <IconButton
                              size="sm"
                              title={t('products.delete_button')}
                              onClick={() => handleDelete(product)}
                              className="text-danger hover:bg-danger/10"
                            >
                              <TrashIcon size={15} />
                            </IconButton>
                          </>
                        )}
                      </div>
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
      ) : (
        <>
          <div
            className={`grid gap-4 ${
              viewMode === 'grid-large'
                ? 'md:grid-cols-2'
                : viewMode === 'grid-medium'
                  ? 'md:grid-cols-3'
                  : 'md:grid-cols-5'
            }`}
          >
            {products.map((product) => {
              const translation = product.translations?.find((tr) => tr.locale === locale) || product.translations?.[0]
              const mainImage = product.images?.[0]?.url
              const imageHeight = viewMode === 'grid-large' ? 'h-48' : viewMode === 'grid-medium' ? 'h-32' : 'h-24'

              return (
                <Card
                  key={product.id}
                  className="cursor-pointer transition-all hover:border-primary hover:shadow-sm"
                  onClick={() => handleProductClick(product.id)}
                >
                  <div className="flex flex-col gap-3">
                    {mainImage ? (
                      <img
                        src={mainImage}
                        alt={translation?.name}
                        className={`w-full ${imageHeight} rounded object-cover`}
                      />
                    ) : (
                      <div className={`w-full ${imageHeight} rounded bg-surface-hover`} />
                    )}
                    <div className="flex flex-col gap-1">
                      <h3 className="truncate text-sm font-semibold">{translation?.name || '-'}</h3>
                      {product.sku && <p className="truncate text-xs text-text-secondary">{product.sku}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">
                          {product.price} {product.currency}
                        </span>
                        <Badge size="sm" variant={STATUS_VARIANT[product.status] ?? 'default'}>{t(`products.status_${product.status}`)}</Badge>
                      </div>
                      {viewMode !== 'grid-small' && (
                        <p className="text-xs text-text-secondary">
                          {t('products.table_quantity')}: {product.quantity}
                        </p>
                      )}
                    </div>
                    {canWrite && viewMode !== 'grid-small' && (
                      <div className="flex justify-end gap-1 pt-1 border-t border-divider/40" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="sm"
                          title={t('products.copy_button')}
                          onClick={() => handleCopy(product)}
                          className="hover:bg-secondary/10 hover:text-secondary"
                        >
                          <CopyIcon size={15} />
                        </IconButton>
                        <IconButton
                          size="sm"
                          title={t('products.edit_button')}
                          onClick={() => handleEdit(product)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <EditIcon size={15} />
                        </IconButton>
                        <IconButton
                          size="sm"
                          title={t('products.delete_button')}
                          onClick={() => handleDelete(product)}
                          className="text-danger hover:bg-danger/10"
                        >
                          <TrashIcon size={15} />
                        </IconButton>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
          {total > rowsPerPage && (
            <Card>
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
          )}
        </>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm ?? (() => {})}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={t('products.delete_button')}
        cancelLabel={t('workspace.cancel')}
      />
    </div>
  )
}
