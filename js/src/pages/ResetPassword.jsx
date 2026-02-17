import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { resetPassword } from '../api/auth'
import { AuthCardLayout } from '../components/layout/AuthCardLayout'
import { Alert, Input, PasswordInput, Button, Link } from '../components/ui'
import { applyServerValidationErrors, buildFormErrorMessage } from '../utils/apiErrors'
import { useI18n } from '../i18n/useI18n'

function buildResetSchema(t) {
  return z
    .object({
      email: z.email(t('validation.email_invalid')),
      token: z.string().min(1, t('validation.token_missing')),
      password: z.string().min(8, t('validation.password_min')),
      password_confirmation: z.string().min(8, t('validation.password_min')),
    })
    .refine((data) => data.password === data.password_confirmation, {
      path: ['password_confirmation'],
      message: t('validation.passwords_mismatch'),
    })
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const emailFromUrl = searchParams.get('email') ?? ''
  const resetSchema = useMemo(() => buildResetSchema(t), [t])

  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: emailFromUrl,
      token,
      password: '',
      password_confirmation: '',
    },
  })

  useEffect(() => {
    setValue('token', token)
    setValue('email', emailFromUrl)
  }, [emailFromUrl, setValue, token])

  const onSubmit = handleSubmit(async (values) => {
    setFormError('')
    setFormSuccess('')

    try {
      await resetPassword(values)
      setFormSuccess(t('auth.reset_success'))
      toast.success(t('toasts.reset_done'))

      setTimeout(() => {
        navigate('/login?reset=success', { replace: true })
      }, 800)
    } catch (error) {
      applyServerValidationErrors(error, setError)
      setFormError(buildFormErrorMessage(error, t))
    }
  })

  return (
    <AuthCardLayout
      title={t('auth.reset_title')}
      subtitle={t('auth.reset_subtitle')}
      footer={
        <p className="text-sm text-text-secondary">
          {t('links.back_to_login_prefix')}{' '}
          <Link to="/login">{t('links.login_page')}</Link>
        </p>
      }
    >
      <Alert variant="success">{formSuccess}</Alert>
      <Alert variant="error">{formError || (!token ? t('auth.reset_invalid_link') : '')}</Alert>

      <form onSubmit={onSubmit} className="flex flex-col gap-1.5">
        <Input
          id="email"
          type="email"
          label={t('common.email')}
          autoComplete="email"
          error={errors.email?.message}
          disabled={isSubmitting}
          {...register('email')}
        />

        <input type="hidden" {...register('token')} />

        <PasswordInput
          id="password"
          label={t('common.new_password')}
          autoComplete="new-password"
          error={errors.password?.message}
          disabled={isSubmitting}
          {...register('password')}
        />

        <PasswordInput
          id="password_confirmation"
          label={t('common.password_confirmation')}
          autoComplete="new-password"
          error={errors.password_confirmation?.message}
          disabled={isSubmitting}
          {...register('password_confirmation')}
        />

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting} disabled={!token}>
          {t('buttons.save_password')}
        </Button>
      </form>
    </AuthCardLayout>
  )
}
