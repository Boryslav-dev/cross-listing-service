import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Link as MuiLink, Stack, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { resetPassword } from '../api/auth'
import { AuthCardLayout } from '../components/layout/AuthCardLayout'
import { Banner } from '../components/ui/Banner'
import { InputField } from '../components/ui/InputField'
import { PasswordField } from '../components/ui/PasswordField'
import { SubmitButton } from '../components/ui/SubmitButton'
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
        <Typography variant="body2" color="text.secondary">
          {t('links.back_to_login_prefix')}{' '}
          <MuiLink component={Link} to="/login" underline="hover">
            {t('links.login_page')}
          </MuiLink>
        </Typography>
      }
    >
      <Banner variant="success">{formSuccess}</Banner>
      <Banner variant="error">{formError || (!token ? t('auth.reset_invalid_link') : '')}</Banner>

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

        <input type="hidden" {...register('token')} />

        <PasswordField
          id="password"
          label={t('common.new_password')}
          autoComplete="new-password"
          error={errors.password?.message}
          disabled={isSubmitting}
          {...register('password')}
        />

        <PasswordField
          id="password_confirmation"
          label={t('common.password_confirmation')}
          autoComplete="new-password"
          error={errors.password_confirmation?.message}
          disabled={isSubmitting}
          {...register('password_confirmation')}
        />

        <SubmitButton type="submit" isLoading={isSubmitting} disabled={!token}>
          {t('buttons.save_password')}
        </SubmitButton>
      </Stack>
    </AuthCardLayout>
  )
}
