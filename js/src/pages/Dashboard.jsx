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
import { useI18n } from '../i18n/useI18n'
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const oauthSuccess = searchParams.get('oauth') === 'google'

  const roleKey = user?.role ?? 'member'
  const translatedRole = t(`roles.${roleKey}`)

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
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', letterSpacing: '0.14em', fontWeight: 800 }}
            >
              {t('app.name')}
            </Typography>
            <LanguageSwitcher compact />
          </Stack>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            {t('dashboard.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.subtitle')}
          </Typography>

          {oauthSuccess ? <Banner variant="success">{t('dashboard.google_success')}</Banner> : null}

          <Divider />

          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              {t('common.email')}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {user?.email}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {t('common.role')}:
            </Typography>
            <Chip
              color="primary"
              label={translatedRole === `roles.${roleKey}` ? roleKey : translatedRole}
              size="small"
            />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            {t('common.last_login')}: {user?.last_login_at ?? t('common.current_session')}
          </Typography>

          <Button variant="contained" color="primary" onClick={logout} sx={{ alignSelf: 'flex-start' }}>
            {t('common.logout')}
          </Button>
        </Stack>
      </Card>
    </Box>
  )
}
