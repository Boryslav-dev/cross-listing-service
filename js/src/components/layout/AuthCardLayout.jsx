import { Box, Card, Stack, Typography } from '@mui/material'
import { useI18n } from '../../i18n/useI18n'
import { LanguageSwitcher } from '../ui/LanguageSwitcher'

export function AuthCardLayout({ title, subtitle, children, footer }) {
  const { t } = useI18n()

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
          maxWidth: 460,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 24px 56px rgba(27, 63, 96, 0.14)',
        }}
      >
        <Stack spacing={2.5} sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
            <Typography
              variant="overline"
              sx={{
                color: 'primary.main',
                letterSpacing: '0.14em',
                fontWeight: 800,
              }}
            >
              {t('app.name')}
            </Typography>
            <LanguageSwitcher compact />
          </Stack>

          <Stack spacing={1}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>

          <Stack spacing={2}>{children}</Stack>

          {footer ? (
            <Stack spacing={1} sx={{ color: 'text.secondary', fontSize: 14 }}>
              {footer}
            </Stack>
          ) : null}
        </Stack>
      </Card>
    </Box>
  )
}
