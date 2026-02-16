import { useState } from 'react'
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

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

export function LoginPage() {
  const { login } = useAuth()
  const [searchParams] = useSearchParams()
  const resetSuccess = searchParams.get('reset') === 'success'
  const oauthStatus = searchParams.get('oauth')
  const googleLoginUrl = getGoogleLoginUrl()
  const oauthErrorMessage =
    oauthStatus === 'missing_data'
      ? 'Google не вернул обязательные данные профиля. Попробуйте снова или используйте email.'
      : oauthStatus === 'error'
        ? 'Не удалось выполнить вход через Google. Попробуйте позже.'
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
  const [formSuccess, setFormSuccess] = useState(resetSuccess ? 'Пароль изменен. Войдите в аккаунт.' : '')

  const onSubmit = handleSubmit(async (values) => {
    setFormError('')
    setFormSuccess('')

    try {
      await login(values)
    } catch (error) {
      applyServerValidationErrors(error, setError)
      setFormError(buildFormErrorMessage(error))
    }
  })

  return (
    <AuthCardLayout
      title="Вход"
      subtitle="Управляйте публикациями и продажами в одном месте"
      footer={
        <Stack spacing={1}>
          <MuiLink component={Link} to="/forgot-password" underline="hover">
            Забыли пароль?
          </MuiLink>
          <Typography variant="body2" color="text.secondary">
            Нет аккаунта?{' '}
            <MuiLink component={Link} to="/register" underline="hover">
              Зарегистрироваться
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
          label="Email"
          autoComplete="email"
          error={errors.email?.message}
          disabled={isSubmitting}
          {...register('email')}
        />

        <PasswordField
          id="password"
          label="Пароль"
          autoComplete="current-password"
          error={errors.password?.message}
          disabled={isSubmitting}
          {...register('password')}
        />

        <SubmitButton type="submit" isLoading={isSubmitting}>
          Войти
        </SubmitButton>

        <Divider sx={{ my: 1 }}>или</Divider>

        <Button
          variant="outlined"
          fullWidth
          size="large"
          href={googleLoginUrl}
          startIcon={<GoogleIcon />}
        >
          Войти через Google
        </Button>
      </Stack>
    </AuthCardLayout>
  )
}
