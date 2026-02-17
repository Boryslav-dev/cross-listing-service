import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthCardLayout } from '../components/layout/AuthCardLayout'
import { Alert, Input, PasswordInput, Button, Divider, Link } from '../components/ui'
import { GoogleIcon } from '../components/icons'
import { useAuth } from '../auth/useAuth'
import { applyServerValidationErrors, buildFormErrorMessage } from '../utils/apiErrors'
import { getGoogleLoginUrl } from '../api/auth'
import { useI18n } from '../i18n/useI18n'

function buildLoginSchema(t) {
  return z.object({
    email: z.email(t('validation.email_invalid')),
    password: z.string().min(1, t('validation.password_required')),
  })
}

export function LoginPage() {
  const { login } = useAuth()
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const resetSuccess = searchParams.get('reset') === 'success'
  const oauthStatus = searchParams.get('oauth')
  const googleLoginUrl = getGoogleLoginUrl()
  const loginSchema = useMemo(() => buildLoginSchema(t), [t])
  const oauthErrorMessage =
    oauthStatus === 'missing_data'
      ? t('auth.oauth_missing_data')
      : oauthStatus === 'error'
        ? t('auth.oauth_error')
        : ''

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const [formError, setFormError] = useState(oauthErrorMessage)
  const [formSuccess, setFormSuccess] = useState(resetSuccess ? t('auth.reset_success_login') : '')

  const onSubmit = handleSubmit(async (values) => {
    setFormError('')
    setFormSuccess('')

    try {
      await login(values)
    } catch (error) {
      applyServerValidationErrors(error, setError)
      setFormError(buildFormErrorMessage(error, t))
    }
  })

  return (
    <AuthCardLayout
      title={t('auth.login_title')}
      subtitle={t('auth.subtitle')}
      footer={
        <div className="flex flex-col gap-2">
          <Link to="/forgot-password">{t('links.forgot_password')}</Link>
          <p className="text-sm text-text-secondary">
            {t('links.no_account')}{' '}
            <Link to="/register">{t('links.sign_up')}</Link>
          </p>
        </div>
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

        <PasswordInput
          id="password"
          label={t('common.password')}
          autoComplete="current-password"
          error={errors.password?.message}
          disabled={isSubmitting}
          {...register('password')}
        />

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          {t('buttons.login')}
        </Button>

        <Divider>{t('common.or')}</Divider>

        <Button
          variant="outline"
          size="lg"
          fullWidth
          href={googleLoginUrl}
          startIcon={<GoogleIcon />}
        >
          {t('buttons.google_login')}
        </Button>
      </form>
    </AuthCardLayout>
  )
}
