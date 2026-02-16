import { useState } from 'react'
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

const registerSchema = z
  .object({
    name: z.string().max(255, 'Максимум 255 символов').optional().or(z.literal('')),
    email: z.string().email('Введите корректный email'),
    password: z.string().min(8, 'Минимум 8 символов'),
    password_confirmation: z.string().min(8, 'Минимум 8 символов'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Пароли не совпадают',
  })

export function RegisterPage() {
  const { register: registerAction } = useAuth()
  const googleLoginUrl = getGoogleLoginUrl()
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
        setInfoMessage('Проверьте почту и подтвердите email для полного доступа.')
      }
    } catch (error) {
      applyServerValidationErrors(error, setError)
      setFormError(buildFormErrorMessage(error))
    }
  })

  return (
    <AuthCardLayout
      title="Создать аккаунт"
      subtitle="Управляйте публикациями и продажами в одном месте"
      footer={
        <Typography variant="body2" color="text.secondary">
          Уже есть аккаунт?{' '}
          <MuiLink component={Link} to="/login" underline="hover">
            Войти
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
          label="Имя"
          autoComplete="name"
          error={errors.name?.message}
          disabled={isSubmitting}
          {...register('name')}
        />

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
          autoComplete="new-password"
          error={errors.password?.message}
          disabled={isSubmitting}
          {...register('password')}
        />

        <PasswordField
          id="password_confirmation"
          label="Подтверждение пароля"
          autoComplete="new-password"
          error={errors.password_confirmation?.message}
          disabled={isSubmitting}
          {...register('password_confirmation')}
        />

        <SubmitButton type="submit" isLoading={isSubmitting}>
          Зарегистрироваться
        </SubmitButton>

        <Divider sx={{ my: 1 }}>или</Divider>

        <Button
          variant="outlined"
          fullWidth
          size="large"
          href={googleLoginUrl}
          startIcon={<GoogleIcon />}
        >
          Продолжить с Google
        </Button>
      </Stack>
    </AuthCardLayout>
  )
}
