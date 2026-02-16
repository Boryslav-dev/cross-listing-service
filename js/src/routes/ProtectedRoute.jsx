import { Navigate } from 'react-router-dom'
import { Box, CircularProgress, Paper, Typography } from '@mui/material'
import { useAuth } from '../auth/useAuth'
import { useI18n } from '../i18n/useI18n'

export function ProtectedRoute({ children }) {
  const { isLoading, isAuthenticated } = useAuth()
  const { t } = useI18n()

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          background:
            'linear-gradient(145deg, #f3f7ff 0%, #eef6ff 40%, #eff8f2 100%)',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2">{t('common.loading')}</Typography>
        </Paper>
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
