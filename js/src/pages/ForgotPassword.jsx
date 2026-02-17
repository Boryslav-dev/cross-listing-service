import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { forgotPassword } from '../api/auth'
import { AuthCardLayout } from '../components/layout/AuthCardLayout'
import { Alert, Input, Button, Link } from '../components/ui'
import { applyServerValidationErrors, buildFormErrorMessage } from '../utils/apiErrors'
import { useI18n } from '../i18n/useI18n'

function buildForgotSchema(t) {
  return z.object({
    email: z.email(t('validation.email_invalid')),
  })
}

export function ForgotPasswordPage() {
  const { t } = useI18n()
  const forgotSchema = useMemo(() => buildForgotSchema(t), [t])
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError('')
    setFormSuccess('')

    try {
      await forgotPassword(values)
      setFormSuccess(t('auth.forgot_success'))
      toast.success(t('toasts.forgot_sent'))
    } catch (error) {
      applyServerValidationErrors(error, setError)
      setFormError(buildFormErrorMessage(error, t))
    }
  })

  return (
    <AuthCardLayout
      title={t('auth.forgot_title')}
      subtitle={t('auth.forgot_subtitle')}
      footer={
        <p className="text-sm text-text-secondary">
          {t('links.remembered_password')}{' '}
          <Link to="/login">{t('links.sign_in')}</Link>
        </p>
      }
    >
      <Alert variant="success">{formSuccess}</Alert>
      <Alert variant="error">{formError}</Alert>

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

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          {t('buttons.send_link')}
        </Button>
      </form>
    </AuthCardLayout>
  )
}
