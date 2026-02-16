import { useState } from 'react'
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

const forgotSchema = z.object({
  email: z.string().email('Введите корректный email'),
})

export function ForgotPasswordPage() {
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
      setFormSuccess('Если email существует, мы отправили ссылку для сброса пароля.')
      toast.success('Письмо отправлено')
    } catch (error) {
      applyServerValidationErrors(error, setError)
      setFormError(buildFormErrorMessage(error))
    }
  })

  return (
    <AuthCardLayout
      title="Восстановление пароля"
      subtitle="Введите email, и мы отправим ссылку для сброса"
      footer={
        <Typography variant="body2" color="text.secondary">
          Вспомнили пароль?{' '}
          <MuiLink component={Link} to="/login" underline="hover">
            Войти
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
          label="Email"
          autoComplete="email"
          error={errors.email?.message}
          disabled={isSubmitting}
          {...register('email')}
        />

        <SubmitButton type="submit" isLoading={isSubmitting}>
          Отправить ссылку
        </SubmitButton>
      </Stack>
    </AuthCardLayout>
  )
}
