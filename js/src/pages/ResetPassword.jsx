import { useEffect, useState } from 'react'
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

const resetSchema = z
  .object({
    email: z.string().email('Введите корректный email'),
    token: z.string().min(1, 'Токен не найден'),
    password: z.string().min(8, 'Минимум 8 символов'),
    password_confirmation: z.string().min(8, 'Минимум 8 символов'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Пароли не совпадают',
  })

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const emailFromUrl = searchParams.get('email') ?? ''

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
      setFormSuccess('Пароль успешно изменен. Сейчас перенаправим вас на вход.')
      toast.success('Пароль изменен')

      setTimeout(() => {
        navigate('/login?reset=success', { replace: true })
      }, 800)
    } catch (error) {
      applyServerValidationErrors(error, setError)
      setFormError(buildFormErrorMessage(error))
    }
  })

  return (
    <AuthCardLayout
      title="Новый пароль"
      subtitle="Задайте новый пароль для вашего аккаунта"
      footer={
        <Typography variant="body2" color="text.secondary">
          Вернуться на{' '}
          <MuiLink component={Link} to="/login" underline="hover">
            страницу входа
          </MuiLink>
        </Typography>
      }
    >
      <Banner variant="success">{formSuccess}</Banner>
      <Banner variant="error">{formError || (!token ? 'Ссылка для сброса пароля некорректна.' : '')}</Banner>

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

        <input type="hidden" {...register('token')} />

        <PasswordField
          id="password"
          label="Новый пароль"
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

        <SubmitButton type="submit" isLoading={isSubmitting} disabled={!token}>
          Сохранить пароль
        </SubmitButton>
      </Stack>
    </AuthCardLayout>
  )
}
