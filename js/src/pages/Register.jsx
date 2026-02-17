import { useMemo, useState } from 'react'
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

function buildRegisterSchema(t) {
  return z
    .object({
      name: z.string().max(255, t('validation.name_max')).optional().or(z.literal('')),
      email: z.email(t('validation.email_invalid')),
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

    try {
      await registerAction(values)
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
        <p className="text-sm text-text-secondary">
          {t('links.already_account')}{' '}
          <Link to="/login">{t('links.sign_in')}</Link>
        </p>
      }
    >
      <Alert variant="error">{formError}</Alert>

      <form onSubmit={onSubmit} className="flex flex-col gap-1.5">
        <Input
          id="name"
          type="text"
          label={t('common.name')}
          autoComplete="name"
          error={errors.name?.message}
          disabled={isSubmitting}
          {...register('name')}
        />

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

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          {t('buttons.register')}
        </Button>

        <Divider>{t('common.or')}</Divider>

        <Button
          variant="outline"
          size="lg"
          fullWidth
          href={googleLoginUrl}
          startIcon={<GoogleIcon />}
        >
          {t('buttons.google_register')}
        </Button>
      </form>
    </AuthCardLayout>
  )
}
