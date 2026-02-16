import { Link } from 'react-router-dom'
import { Link as MuiLink, Typography } from '@mui/material'
import { AuthCardLayout } from '../components/layout/AuthCardLayout'
import { Banner } from '../components/ui/Banner'
import { useI18n } from '../i18n/useI18n'

export function EmailVerifiedPage() {
  const { t } = useI18n()

  return (
    <AuthCardLayout
      title={t('auth.email_verified_title')}
      subtitle={t('auth.email_verified_subtitle')}
      footer={
        <Typography variant="body2" color="text.secondary">
          {t('links.go_to_sign_in_prefix')}{' '}
          <MuiLink component={Link} to="/login" underline="hover">
            {t('links.sign_in_target')}
          </MuiLink>
        </Typography>
      }
    >
      <Banner variant="success">{t('auth.email_verified_success')}</Banner>
    </AuthCardLayout>
  )
}
