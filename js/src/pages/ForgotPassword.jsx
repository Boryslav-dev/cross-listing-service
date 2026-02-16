import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Link as MuiLink, Stack, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { forgotPassword } from '../api/auth'
import { AuthCardLayout } from '../components/layout/AuthCardLayout'
import { Banner } from '../components/ui/Banner'
import { InputField } from '../components/ui/InputField'
import { SubmitButton } from '../components/ui/SubmitButton'
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
        <Typography variant="body2" color="text.secondary">
          {t('links.remembered_password')}{' '}
          <MuiLink component={Link} to="/login" underline="hover">
            {t('links.sign_in')}
          </MuiLink>
        </Typography>
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

        <SubmitButton type="submit" isLoading={isSubmitting}>
          {t('buttons.send_link')}
        </SubmitButton>
      </Stack>
    </AuthCardLayout>
  )
}
