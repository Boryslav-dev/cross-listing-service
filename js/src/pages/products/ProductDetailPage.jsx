import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getProduct, deleteProduct } from '../../api/products'
import { useWorkspace } from '../../workspaces/useWorkspace'
import { buildFormErrorMessage } from '../../utils/apiErrors'
import { useI18n } from '../../i18n/useI18n'
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Link,
  Spinner,
} from '../../components/ui'
import { ChevronLeftIcon, ChevronRightIcon, CopyIcon, XIcon } from '../../components/icons'

const STATUS_VARIANT = { draft: 'warning', active: 'success', archived: 'default' }

export function ProductDetailPage() {
  const navigate = useNavigate()
  const { productId } = useParams()
  const queryClient = useQueryClient()
  const { t, locale } = useI18n()
  const { currentWorkspaceId, hasPermission } = useWorkspace()

  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null })
  const [selectedImage, setSelectedImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const canWrite = useMemo(() => hasPermission('products.write'), [hasPermission])

  const productQuery = useQuery({
    queryKey: ['product', currentWorkspaceId, productId],
    queryFn: () => getProduct(currentWorkspaceId, productId),
    enabled: Number.isFinite(currentWorkspaceId) && currentWorkspaceId > 0 && !!productId,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(currentWorkspaceId, productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products', currentWorkspaceId] })
      toast.success(t('toasts.product_deleted'))
      navigate('/app/products')
    },
    onError: (error) => {
      toast.error(buildFormErrorMessage(error, t))
    },
  })

  const product = productQuery.data?.product

  const handleDelete = () => {
    const translation = product?.translations?.find((tr) => tr.locale === locale) || product?.translations?.[0]
    setConfirmDialog({
      open: true,
      title: t('products.delete_confirm_title'),
      message: translation?.name || product?.sku || '',
      onConfirm: () => deleteMutation.mutate(),
    })
  }

  const handlePrev = () => setSelectedImage((prev) => (prev > 0 ? prev - 1 : product.images.length - 1))
  const handleNext = () => setSelectedImage((prev) => (prev < product.images.length - 1 ? prev + 1 : 0))

  // Keyboard navigation for gallery
  useEffect(() => {
    if (!product?.images || product.images.length <= 1) return
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'Escape' && lightboxOpen) setLightboxOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [product, lightboxOpen])

  if (!currentWorkspaceId) {
    return <Alert variant="warning">{t('workspace.select_workspace_prompt')}</Alert>
  }

  if (productQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    )
  }

  if (productQuery.isError || !product) {
    return <Alert variant="error">{t('errors.server')}</Alert>
  }

  const currentTranslation = product.translations?.find((tr) => tr.locale === locale) || product.translations?.[0]
  const hasImages = product.images && product.images.length > 0
  const mainImageUrl = product.images?.[selectedImage]?.url || product.images?.[0]?.url

  return (
    <div className="flex flex-col gap-6">
      {/* Header: breadcrumb + actions */}
      <div className="flex items-center justify-between gap-4">
        <nav className="text-sm text-text-secondary">
          <Link to="/app/products">{t('products.list_title')}</Link>
          <span className="mx-2">/</span>
          <span className="text-text-primary">{currentTranslation?.name}</span>
        </nav>

        {canWrite && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              startIcon={<CopyIcon size={15} />}
              onClick={() => {
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
              }}
            >
              {t('products.copy_button')}
            </Button>
            <Button size="sm" onClick={() => navigate(`/app/products/${productId}/edit`)}>
              {t('products.edit_button')}
            </Button>
            <Button size="sm" variant="danger" onClick={handleDelete}>
              {t('products.delete_button')}
            </Button>
          </div>
        )}
      </div>

      {/* Top section: image gallery + name + description */}
      <div className="grid gap-6 md:grid-cols-2 md:items-start">

        {/* Left: Image Gallery */}
        <div className="flex flex-col gap-3">
          {/* Main image — fixed height container */}
          <div className="group relative w-full overflow-hidden rounded-lg bg-gray-100" style={{ height: '380px' }}>
            {hasImages ? (
              <img
                src={mainImageUrl}
                alt={currentTranslation?.name}
                onClick={() => setLightboxOpen(true)}
                className="h-full w-full cursor-zoom-in object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-text-disabled">
                <span className="text-sm">No image</span>
              </div>
            )}

            {/* Carousel arrows */}
            {product.images && product.images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                >
                  <ChevronLeftIcon size={20} />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                >
                  <ChevronRightIcon size={20} />
                </button>

                {/* Dot indicators */}
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        selectedImage === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/90'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`h-16 w-16 overflow-hidden rounded border-2 transition-colors ${
                    selectedImage === index ? 'border-primary' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img src={image.url} alt={`${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Name + status + description */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-bold leading-tight">{currentTranslation?.name}</h1>
            <Badge size="md" variant={STATUS_VARIANT[product.status] ?? 'default'} className="mt-2">{t(`products.status_${product.status}`)}</Badge>
          </div>

          {currentTranslation?.description && (
            <div className="max-h-[380px] overflow-y-auto rounded-lg border border-border bg-surface p-4 prose prose-sm max-w-none text-text-secondary [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_p:not(:last-child)]:mb-2 [&_li]:mb-0.5"
              dangerouslySetInnerHTML={{ __html: currentTranslation.description }}
            />
          )}
        </div>
      </div>

      {/* Details Card — below the 2-column section */}
      <Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {product.sku && (
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-text-secondary">{t('products.form_sku')}</label>
              <p className="mt-1 font-semibold">{product.sku}</p>
            </div>
          )}
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-text-secondary">{t('products.form_price')}</label>
            <p className="mt-1 text-xl font-bold">
              {product.price} {product.currency}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-text-secondary">{t('products.form_quantity')}</label>
            <p className="mt-1 font-semibold">{product.quantity}</p>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-text-secondary">{t('products.form_status')}</label>
            <Badge size="md" variant={STATUS_VARIANT[product.status] ?? 'default'} className="mt-1">{t(`products.status_${product.status}`)}</Badge>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-text-secondary">{t('products.form_condition')}</label>
            <p className="mt-1 font-semibold">
              {product.condition ? t(`products.condition_${product.condition}`) : t('products.condition_not_specified')}
            </p>
          </div>
        </div>
      </Card>

      {/* All Translations */}
      {product.translations && product.translations.length > 0 && (
        <Card>
          <h3 className="mb-3 text-base font-semibold">{t('products.detail_title')}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {product.translations.map((translation) => (
              <div key={translation.locale} className="rounded border border-border p-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {translation.locale === 'en' ? 'English' : 'Українська'}
                </h4>
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="text-xs text-text-secondary">{t('products.form_name')}</label>
                    <p className="font-medium">{translation.name}</p>
                  </div>
                  {translation.description && (
                    <div>
                      <label className="text-xs text-text-secondary">{t('products.form_description')}</label>
                      <div
                        className="text-sm text-text-secondary mt-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p:not(:last-child)]:mb-1 [&_li]:mb-0.5"
                        dangerouslySetInnerHTML={{ __html: translation.description }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lightbox */}
      {lightboxOpen && mainImageUrl && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Prev/Next in lightbox */}
          {product.images && product.images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeftIcon size={24} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRightIcon size={24} />
              </button>
            </>
          )}

          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <XIcon size={20} />
          </button>

          {/* Image counter */}
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
              {selectedImage + 1} / {product.images.length}
            </div>
          )}

          <img
            src={mainImageUrl}
            alt={currentTranslation?.name}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body,
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
