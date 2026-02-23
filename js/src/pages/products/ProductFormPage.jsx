import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createProduct, getProduct, updateProduct } from '../../api/products'
import { useWorkspace } from '../../workspaces/useWorkspace'
import { buildFormErrorMessage } from '../../utils/apiErrors'
import { useI18n } from '../../i18n/useI18n'
import {
  Alert,
  Button,
  Card,
  ImageUpload,
  Input,
  Link,
  RichTextEditor,
  Select,
  Spinner,
} from '../../components/ui'

function buildProductSchema(t) {
  return z.object({
    sku: z.string().max(100).optional().or(z.literal('')),
    price: z.coerce.number().min(0, t('validation.price_min')),
    currency: z.string().length(3),
    quantity: z.coerce.number().int().min(0, t('validation.quantity_min')),
    condition: z.string().nullable().optional(),
    translations: z.object({
      uk: z.object({
        name: z.string().min(1, t('validation.name_required')),
        description: z.string().optional().or(z.literal('')),
      }),
    }),
  })
}

export function ProductFormPage() {
  const { productId } = useParams()
  const isEdit = !!productId
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const { currentWorkspaceId } = useWorkspace()

  // Copy mode: data passed via router state from duplicate action
  const copySource = location.state?.copyFrom ?? null
  const isCopy = !isEdit && !!copySource

  const [images, setImages] = useState(copySource?.images ?? [])
  const [formError, setFormError] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const autoSaveIdRef = useRef(productId || null)
  const lastSavedRef = useRef(null)
  const latestDataRef = useRef(null)
  const isAutoSavingRef = useRef(false)

  const schema = useMemo(() => buildProductSchema(t), [t])

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: copySource ? {
      sku: '',
      price: copySource.price ?? 0,
      currency: copySource.currency ?? 'UAH',
      quantity: copySource.quantity ?? 0,
      condition: copySource.condition ?? null,
      translations: {
        uk: {
          name: copySource.ukName ? `${t('products.copy_prefix')} ${copySource.ukName}` : '',
          description: copySource.ukDescription ?? '',
        },
      },
    } : {
      sku: '',
      price: 0,
      currency: 'UAH',
      quantity: 0,
      condition: null,
      translations: {
        uk: { name: '', description: '' },
      },
    },
  })

  // Load product data for edit mode
  const productQuery = useQuery({
    queryKey: ['product', currentWorkspaceId, productId],
    queryFn: () => getProduct(currentWorkspaceId, productId),
    enabled: isEdit && !!currentWorkspaceId && !!productId,
  })

  const product = productQuery.data?.product

  useEffect(() => {
    if (product) {
      const ukTranslation = product.translations?.find((t) => t.locale === 'uk')

      reset({
        sku: product.sku || '',
        price: product.price,
        currency: product.currency,
        quantity: product.quantity,
        condition: product.condition ?? null,
        translations: {
          uk: { name: ukTranslation?.name || '', description: ukTranslation?.description || '' },
        },
      })
      setImages(product.images || [])
    }
  }, [product, reset])

  // Keep latest data in ref so the auto-save timeout always has fresh values
  const watchedValues = watch()
  useEffect(() => {
    latestDataRef.current = { values: watchedValues, images }
  })

  // Auto-save: triggers 3s after the last change
  useEffect(() => {
    const str = JSON.stringify({ v: watchedValues, i: images })
    if (str === lastSavedRef.current) return

    const timer = setTimeout(async () => {
      const { values, images: imgs } = latestDataRef.current ?? {}
      if (!values || !currentWorkspaceId) return
      if (!values.translations?.uk?.name?.trim()) return
      if (isAutoSavingRef.current || isSubmitting) return

      const dataStr = JSON.stringify({ v: values, i: imgs })
      if (dataStr === lastSavedRef.current) return

      isAutoSavingRef.current = true
      setAutoSaveStatus('saving')
      try {
        const translations = [
          { locale: 'uk', name: values.translations.uk.name, description: values.translations.uk.description || null },
        ]
        const payload = {
          ...values,
          sku: values.sku || null,
          status: autoSaveIdRef.current ? (product?.status ?? 'draft') : 'draft',
          translations,
          images: imgs?.length > 0 ? imgs : null,
        }

        if (autoSaveIdRef.current) {
          await updateProduct(currentWorkspaceId, autoSaveIdRef.current, payload)
        } else {
          const response = await createProduct(currentWorkspaceId, payload)
          const savedId = response?.product?.id
          if (savedId) {
            autoSaveIdRef.current = savedId
            navigate(`/app/products/${savedId}/edit`, { replace: true })
            await queryClient.invalidateQueries({ queryKey: ['products', currentWorkspaceId] })
          }
        }

        lastSavedRef.current = dataStr
        setAutoSaveStatus('saved')
        setTimeout(() => setAutoSaveStatus('idle'), 3000)
      } catch {
        setAutoSaveStatus('error')
        setTimeout(() => setAutoSaveStatus('idle'), 3000)
      } finally {
        isAutoSavingRef.current = false
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [ // eslint-disable-next-line react-hooks/exhaustive-deps
    watchedValues.translations?.uk?.name,
    watchedValues.translations?.uk?.description,
    watchedValues.sku,
    watchedValues.price,
    watchedValues.currency,
    watchedValues.quantity,
    images,
  ])

  const mutation = useMutation({
    mutationFn: async (data) => {
      const translations = [
        { locale: 'uk', name: data.translations.uk.name, description: data.translations.uk.description || null },
      ]

      const payload = {
        ...data,
        sku: data.sku || null,
        status: isEdit ? product.status : 'draft',
        translations,
        images: images.length > 0 ? images : null,
      }

      if (isEdit) return updateProduct(currentWorkspaceId, productId, payload)
      return createProduct(currentWorkspaceId, payload)
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['products', currentWorkspaceId] })
      toast.success(t(isEdit ? 'toasts.product_updated' : 'toasts.product_created'))
      const id = response?.product?.id ?? productId
      navigate(id ? `/app/products/${id}` : '/app/products')
    },
    onError: (error) => {
      setFormError(buildFormErrorMessage(error, t))
    },
  })

  const onSubmit = handleSubmit(async (data) => {
    setFormError('')
    await mutation.mutateAsync(data)
  })

  const currencyOptions = [
    { value: 'UAH', label: 'UAH — Гривня' },
    { value: 'USD', label: 'USD — Dollar' },
    { value: 'EUR', label: 'EUR — Euro' },
    { value: 'GBP', label: 'GBP — Pound' },
    { value: 'PLN', label: 'PLN — Złoty' },
    { value: 'CZK', label: 'CZK — Koruna' },
    { value: 'HUF', label: 'HUF — Forint' },
    { value: 'RON', label: 'RON — Leu' },
    { value: 'MDL', label: 'MDL — Leu moldovenesc' },
    { value: 'BGN', label: 'BGN — Lev' },
    { value: 'HRK', label: 'HRK — Kuna' },
    { value: 'RSD', label: 'RSD — Dinar' },
    { value: 'CHF', label: 'CHF — Franc' },
    { value: 'SEK', label: 'SEK — Krona' },
    { value: 'NOK', label: 'NOK — Krone' },
    { value: 'DKK', label: 'DKK — Krone' },
  ]

  const conditionOptions = [
    { value: '', label: t('products.condition_not_specified') },
    { value: 'new', label: t('products.condition_new') },
    { value: 'like_new', label: t('products.condition_like_new') },
    { value: 'good', label: t('products.condition_good') },
    { value: 'fair', label: t('products.condition_fair') },
    { value: 'poor', label: t('products.condition_poor') },
  ]

  if (isEdit && productQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isEdit && (productQuery.isError || (!productQuery.isLoading && !product))) {
    return <Alert variant="error">{t('errors.server')}</Alert>
  }

  const pageTitle = isEdit
    ? t('products.edit_dialog_title')
    : isCopy
      ? t('products.copy_dialog_title')
      : t('products.create_dialog_title')
  const productName = product?.translations?.find((tr) => tr.locale === 'en')?.name
    || product?.translations?.[0]?.name
    || product?.sku
    || ''

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-text-secondary flex items-center gap-1">
        <Link to="/app/products">{t('products.list_title')}</Link>
        {isEdit && (
          <>
            <span className="mx-1">/</span>
            <Link to={`/app/products/${productId}`}>{productName}</Link>
          </>
        )}
        <span className="mx-1">/</span>
        <span className="text-text-primary font-medium">{pageTitle}</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          {autoSaveStatus === 'saving' && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
              {t('products.autosave_saving')}
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              {t('products.autosave_saved')}
            </span>
          )}
          {autoSaveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-danger">
              <span className="w-1.5 h-1.5 rounded-full bg-danger" />
              {t('products.autosave_error')}
            </span>
          )}
        </div>
      </div>

      <form id="product-form" onSubmit={onSubmit} className="flex flex-col gap-6">
        {formError && <Alert variant="error">{formError}</Alert>}

        {/* Content */}
        <Card>
          <h2 className="mb-4 text-base font-semibold">{t('products.form_content')}</h2>
          <div className="flex flex-col gap-4">
            <Input
              label={t('products.form_name')}
              error={errors.translations?.uk?.name?.message}
              disabled={isSubmitting}
              {...register('translations.uk.name')}
            />
            <Controller
              name="translations.uk.description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  label={t('products.form_description')}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.translations?.uk?.description?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>
        </Card>

        {/* Product Details */}
        <Card>
          <h2 className="mb-4 text-base font-semibold">{t('products.detail_title')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label={t('products.form_sku')}
              error={errors.sku?.message}
              disabled={isSubmitting}
              {...register('sku')}
            />

            <Input
              type="number"
              step="0.01"
              label={t('products.form_price')}
              error={errors.price?.message}
              disabled={isSubmitting}
              {...register('price')}
            />

            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('products.form_currency')}
                  options={currencyOptions}
                  error={errors.currency?.message}
                  disabled={isSubmitting}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <Input
              type="number"
              label={t('products.form_quantity')}
              error={errors.quantity?.message}
              disabled={isSubmitting}
              {...register('quantity')}
            />

            <Controller
              name="condition"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('products.form_condition')}
                  options={conditionOptions}
                  error={errors.condition?.message}
                  disabled={isSubmitting}
                  value={field.value ?? ''}
                  onChange={(val) => field.onChange(val || null)}
                />
              )}
            />
          </div>
        </Card>

        {/* Images */}
        <Card>
          <h2 className="mb-4 text-base font-semibold">{t('products.form_images')}</h2>
          <ImageUpload value={images} onChange={setImages} maxFiles={10} disabled={isSubmitting} />
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(isEdit ? `/app/products/${productId}` : '/app/products')}
            disabled={isSubmitting}
          >
            {t('workspace.cancel')}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {t('workspace.settings_save_button')}
          </Button>
        </div>
      </form>
    </div>
  )
}
