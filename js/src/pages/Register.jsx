import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

function buildRegisterSchema(t) {
  return z
    .object({
      name: z.string().max(255, t('validation.name_max')).optional().or(z.literal('')),
      email: z.string().email(t('validation.email_invalid')),
      password: z.string().min(8, t('validation.password_min')),
      password_confirmation: z.string().min(8, t('validation.password_min')),
    })
    .refine((data) => data.password === data.password_confirmation, {
      path: ['password_confirmation'],
      message: t('validation.passwords_mismatch'),
    })
}

export function RegisterPage() {
  const { register: registerAction } = useAuth()
  const { t } = useI18n()
  const googleLoginUrl = getGoogleLoginUrl()
  const registerSchema = useMemo(() => buildRegisterSchema(t), [t])
  const [formError, setFormError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError('')
    setInfoMessage('')

    try {
      const response = await registerAction(values)

      if (response.requires_email_verification) {
        setInfoMessage(t('auth.register_verify_hint'))
      }
    } catch (error) {
      applyServerValidationErrors(error, setError)
      setFormError(buildFormErrorMessage(error, t))
    }
  })

  return (
    <AuthCardLayout
      title={t('auth.register_title')}
      subtitle={t('auth.subtitle')}
      footer={
        <Typography variant="body2" color="text.secondary">
          {t('links.already_account')}{' '}
          <MuiLink component={Link} to="/login" underline="hover">
            {t('links.sign_in')}
          </MuiLink>
        </Typography>
      }
    >
      <Banner variant="success">{infoMessage}</Banner>
      <Banner variant="error">{formError}</Banner>

      <Stack spacing={0.75} component="form" onSubmit={onSubmit}>
        <InputField
          id="name"
          type="text"
          label={t('common.name')}
          autoComplete="name"
          error={errors.name?.message}
          disabled={isSubmitting}
          {...register('name')}
        />

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

        <SubmitButton type="submit" isLoading={isSubmitting}>
          {t('buttons.register')}
        </SubmitButton>

        <Divider sx={{ my: 1 }}>{t('common.or')}</Divider>

        <Button
          variant="outlined"
          fullWidth
          size="large"
          href={googleLoginUrl}
          startIcon={<GoogleIcon />}
        >
          {t('buttons.google_register')}
        </Button>
      </Stack>
    </AuthCardLayout>
  )
}
