import { Link } from 'react-router-dom'
import { Link as MuiLink, Typography } from '@mui/material'
import { AuthCardLayout } from '../components/layout/AuthCardLayout'
import { Banner } from '../components/ui/Banner'

export function EmailVerifiedPage() {
  return (
    <AuthCardLayout
      title="Email подтвержден"
      subtitle="Теперь вы можете войти и продолжить работу"
      footer={
        <Typography variant="body2" color="text.secondary">
          Перейти к{' '}
          <MuiLink component={Link} to="/login" underline="hover">
            входу
          </MuiLink>
        </Typography>
      }
    >
      <Banner variant="success">Подтверждение прошло успешно.</Banner>
    </AuthCardLayout>
  )
}
