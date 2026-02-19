import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createProduct, updateProduct } from '../../api/products'
import { useWorkspace } from '../../workspaces/useWorkspace'
import { buildFormErrorMessage } from '../../utils/apiErrors'
import { useI18n } from '../../i18n/useI18n'
import {
  Alert,
  Button,
  Dialog,
  ImageUpload,
  Input,
  Select,
  Textarea,
} from '../ui'
import { cn } from '../../utils/cn'

function buildProductSchema(t, enabledLocales) {
  const translationsSchema = {}

  if (enabledLocales.en) {
    translationsSchema.en = z.object({
      name: z.string().min(1, t('validation.name_required')),
      description: z.string().optional().or(z.literal('')),
    })
  }

  if (enabledLocales.uk) {
    translationsSchema.uk = z.object({
      name: z.string().min(1, t('validation.name_required')),
      description: z.string().optional().or(z.literal('')),
    })
  }

  return z.object({
    sku: z.string().max(100).optional().or(z.literal('')),
    price: z.coerce.number().min(0, t('validation.price_min')),
    currency: z.string().length(3),
    quantity: z.coerce.number().int().min(0, t('validation.quantity_min')),
    translations: z.object(translationsSchema),
  })
}

export function ProductFormDialog({ open, onClose, product = null }) {
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const { currentWorkspaceId } = useWorkspace()

  const [activeLocale, setActiveLocale] = useState('en')
  const [images, setImages] = useState([])
  const [formError, setFormError] = useState('')
  const [enabledLocales, setEnabledLocales] = useState({ en: true, uk: true })

  const isEdit = !!product

  const schema = useMemo(() => buildProductSchema(t, enabledLocales), [t, enabledLocales])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      sku: '',
      price: 0,
      currency: 'USD',
      quantity: 0,
      translations: {
        en: { name: '', description: '' },
        uk: { name: '', description: '' },
      },
    },
  })

  useEffect(() => {
    if (product) {
      const enTranslation = product.translations?.find((t) => t.locale === 'en')
      const ukTranslation = product.translations?.find((t) => t.locale === 'uk')

      const translations = {}
      if (enTranslation) {
        translations.en = {
          name: enTranslation.name || '',
          description: enTranslation.description || '',
        }
      }
      if (ukTranslation) {
        translations.uk = {
          name: ukTranslation.name || '',
          description: ukTranslation.description || '',
        }
      }

      const newEnabledLocales = {
        en: !!enTranslation,
        uk: !!ukTranslation,
      }
      setEnabledLocales(newEnabledLocales)

      // Set active locale to first available language
      if (enTranslation) {
        setActiveLocale('en')
      } else if (ukTranslation) {
        setActiveLocale('uk')
      }

      reset({
        sku: product.sku || '',
        price: product.price,
        currency: product.currency,
        quantity: product.quantity,
        translations,
      })

      setImages(product.images || [])
    } else {
      setEnabledLocales({ en: true, uk: true })
      setActiveLocale('en')
      reset({
        sku: '',
        price: 0,
        currency: 'USD',
        quantity: 0,
        translations: {
          en: { name: '', description: '' },
          uk: { name: '', description: '' },
        },
      })
      setImages([])
    }
  }, [product, reset])

  const mutation = useMutation({
    mutationFn: async (data) => {
      const translations = []
      if (enabledLocales.en && data.translations.en) {
        translations.push({
          locale: 'en',
          name: data.translations.en.name,
          description: data.translations.en.description || null,
        })
      }
      if (enabledLocales.uk && data.translations.uk) {
        translations.push({
          locale: 'uk',
          name: data.translations.uk.name,
          description: data.translations.uk.description || null,
        })
      }

      const payload = {
        ...data,
        sku: data.sku || null,
        status: isEdit ? product.status : 'draft',
        translations,
        images: images.length > 0 ? images : null,
      }

      if (isEdit) {
        return updateProduct(currentWorkspaceId, product.id, payload)
      }
      return createProduct(currentWorkspaceId, payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products', currentWorkspaceId] })
      toast.success(t(isEdit ? 'toasts.product_updated' : 'toasts.product_created'))
      onClose()
      reset()
      setImages([])
      setFormError('')
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
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'UAH', label: 'UAH' },
  ]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      title={t(isEdit ? 'products.edit_dialog_title' : 'products.create_dialog_title')}
      actions={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('workspace.cancel')}
          </Button>
          <Button type="submit" form="product-form" isLoading={isSubmitting}>
            {t('workspace.settings_save_button')}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        {formError && <Alert variant="error">{formError}</Alert>}

        {/* Language Selection */}
        <div className="rounded-md border border-border p-3">
          <label className="mb-2 block text-sm font-medium text-text-primary">
            {t('products.form_languages')}
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledLocales.en}
                onChange={(e) => {
                  const newEnabled = { ...enabledLocales, en: e.target.checked }
                  setEnabledLocales(newEnabled)
                  if (!e.target.checked && activeLocale === 'en') {
                    setActiveLocale(enabledLocales.uk ? 'uk' : '')
                  }
                }}
                className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-sm font-medium">English</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledLocales.uk}
                onChange={(e) => {
                  const newEnabled = { ...enabledLocales, uk: e.target.checked }
                  setEnabledLocales(newEnabled)
                  if (!e.target.checked && activeLocale === 'uk') {
                    setActiveLocale(enabledLocales.en ? 'en' : '')
                  }
                }}
                className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-sm font-medium">Українська</span>
            </label>
          </div>
        </div>

        {/* Language Tabs */}
        {(enabledLocales.en || enabledLocales.uk) && (
          <div className="flex gap-2 border-b border-border">
            {enabledLocales.en && (
              <button
                type="button"
                onClick={() => setActiveLocale('en')}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  activeLocale === 'en'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                English
              </button>
            )}
            {enabledLocales.uk && (
              <button
                type="button"
                onClick={() => setActiveLocale('uk')}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  activeLocale === 'uk'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                Українська
              </button>
            )}
          </div>
        )}

        {/* Translation Fields */}
        {enabledLocales.en && activeLocale === 'en' && (
          <div className="flex flex-col gap-3">
            <Input
              label={t('products.form_name') + ' (EN)'}
              error={errors.translations?.en?.name?.message}
              disabled={isSubmitting}
              {...register('translations.en.name')}
            />
            <Textarea
              label={t('products.form_description') + ' (EN)'}
              error={errors.translations?.en?.description?.message}
              disabled={isSubmitting}
              rows={4}
              {...register('translations.en.description')}
            />
          </div>
        )}

        {enabledLocales.uk && activeLocale === 'uk' && (
          <div className="flex flex-col gap-3">
            <Input
              label={t('products.form_name') + ' (UK)'}
              error={errors.translations?.uk?.name?.message}
              disabled={isSubmitting}
              {...register('translations.uk.name')}
            />
            <Textarea
              label={t('products.form_description') + ' (UK)'}
              error={errors.translations?.uk?.description?.message}
              disabled={isSubmitting}
              rows={4}
              {...register('translations.uk.description')}
            />
          </div>
        )}

        {!enabledLocales.en && !enabledLocales.uk && (
          <Alert variant="warning">{t('products.form_languages_required')}</Alert>
        )}

        {/* Global Fields */}
        <div className="grid gap-3 md:grid-cols-2">
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
        </div>

        {/* Images */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">
            {t('products.form_images')}
          </label>
          <ImageUpload value={images} onChange={setImages} maxFiles={10} disabled={isSubmitting} />
        </div>
      </form>
    </Dialog>
  )
}
