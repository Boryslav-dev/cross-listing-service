import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { Banner } from '../components/ui/Banner'
import { useAuth } from '../auth/useAuth'

export function DashboardPage() {
  const { user, logout, resendVerificationEmail } = useAuth()
  const [searchParams] = useSearchParams()
  const [isResending, setIsResending] = useState(false)
  const [verificationError, setVerificationError] = useState('')

  const isVerified = Boolean(user?.email_verified_at)
  const oauthSuccess = searchParams.get('oauth') === 'google'

  const handleResend = async () => {
    setVerificationError('')
    setIsResending(true)

    try {
      await resendVerificationEmail()
    } catch {
      setVerificationError('Не удалось отправить письмо подтверждения. Попробуйте позже.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: 3 },
        background:
          'linear-gradient(145deg, #f3f7ff 0%, #eef6ff 40%, #eff8f2 100%)',
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 620,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 24px 56px rgba(27, 63, 96, 0.14)',
          p: { xs: 2.5, sm: 3.5 },
        }}
      >
        <Stack spacing={2}>
          <Typography
            variant="overline"
            sx={{ color: 'primary.main', letterSpacing: '0.14em', fontWeight: 800 }}
          >
            Cross Listing SaaS
          </Typography>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Рабочее пространство
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Базовый dashboard-заглушка для защищенной зоны /app
          </Typography>

          {oauthSuccess ? <Banner variant="success">Вход через Google выполнен успешно.</Banner> : null}

          {!isVerified ? (
            <>
              <Banner variant="error">
                Подтвердите email, чтобы открыть полный доступ к функционалу.
              </Banner>

              {verificationError ? <Banner variant="error">{verificationError}</Banner> : null}

              <Button
                variant="outlined"
                onClick={handleResend}
                disabled={isResending}
                sx={{ alignSelf: 'flex-start' }}
              >
                {isResending ? 'Отправка...' : 'Отправить письмо снова'}
              </Button>
            </>
          ) : null}

          <Divider />

          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {user?.email}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Role:
            </Typography>
            <Chip color="primary" label={user?.role ?? 'member'} size="small" />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Last login: {user?.last_login_at ?? 'Текущая сессия'}
          </Typography>

          <Button variant="contained" color="primary" onClick={logout} sx={{ alignSelf: 'flex-start' }}>
            Logout
          </Button>
        </Stack>
      </Card>
    </Box>
  )
}
