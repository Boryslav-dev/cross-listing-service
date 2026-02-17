import { AuthCardLayout } from '../components/layout/AuthCardLayout'
import { Alert, Link } from '../components/ui'
import { useI18n } from '../i18n/useI18n'

export function EmailVerifiedPage() {
  const { t } = useI18n()

  return (
    <AuthCardLayout
      title={t('auth.email_verified_title')}
      subtitle={t('auth.email_verified_subtitle')}
      footer={
        <p className="text-sm text-text-secondary">
          {t('links.go_to_sign_in_prefix')}{' '}
          <Link to="/login">{t('links.sign_in_target')}</Link>
        </p>
      }
    >
      <Alert variant="success">{t('auth.email_verified_success')}</Alert>
    </AuthCardLayout>
  )
}
