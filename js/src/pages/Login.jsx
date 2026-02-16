import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Divider, Link as MuiLink, Stack, Typography } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthCardLayout } from '../components/layout/AuthCardLayout'
import { Banner } from '../components/ui/Banner'
import { InputField } from '../components/ui/InputField'
import { PasswordField } from '../components/ui/PasswordField'
import { SubmitButton } from '../components/ui/SubmitButton'
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
        <Stack spacing={1}>
          <MuiLink component={Link} to="/forgot-password" underline="hover">
            {t('links.forgot_password')}
          </MuiLink>
          <Typography variant="body2" color="text.secondary">
            {t('links.no_account')}{' '}
            <MuiLink component={Link} to="/register" underline="hover">
              {t('links.sign_up')}
            </MuiLink>
          </Typography>
        </Stack>
      }
    >
      <Banner variant="success">{formSuccess}</Banner>
      <Banner variant="error">{formError}</Banner>

      <Stack spacing={0.75} component="form" onSubmit={onSubmit}>
        <InputField
          id="email"
          type="email"
          label={t('common.email')}
          autoComplete="email"
          error={errors.email?.message}
          disabled={isSubmitting}
          {...register('email')}
        />

        <PasswordField
          id="password"
          label={t('common.password')}
          autoComplete="current-password"
          error={errors.password?.message}
          disabled={isSubmitting}
          {...register('password')}
        />

        <SubmitButton type="submit" isLoading={isSubmitting}>
          {t('buttons.login')}
        </SubmitButton>

        <Divider sx={{ my: 1 }}>{t('common.or')}</Divider>

        <Button
          variant="outlined"
          fullWidth
          size="large"
          href={googleLoginUrl}
          startIcon={<GoogleIcon />}
        >
          {t('buttons.google_login')}
        </Button>
      </Stack>
    </AuthCardLayout>
  )
}
