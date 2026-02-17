import { useSearchParams } from 'react-router-dom'
import { Alert, Button, Badge, Divider, LanguageSwitcher } from '../components/ui'
import { useAuth } from '../auth/useAuth'
import { useI18n } from '../i18n/useI18n'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const oauthSuccess = searchParams.get('oauth') === 'google'

  const roleKey = user?.role ?? 'member'
  const translatedRole = t(`roles.${roleKey}`)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-teal-50/30">
      <div className="w-full max-w-[620px] bg-surface rounded-xl shadow-lg border border-divider/40 p-6 sm:p-8">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start gap-3">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
              {t('app.name')}
            </span>
            <LanguageSwitcher compact />
          </div>

          <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-sm text-text-secondary">{t('dashboard.subtitle')}</p>

          {oauthSuccess && <Alert variant="success">{t('dashboard.google_success')}</Alert>}

          <Divider />

          <div className="flex flex-col gap-2">
            <span className="text-sm text-text-secondary">{t('common.email')}</span>
            <span className="text-sm font-semibold">{user?.email}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">{t('common.role')}:</span>
            <Badge variant="primary" size="sm">
              {translatedRole === `roles.${roleKey}` ? roleKey : translatedRole}
            </Badge>
          </div>

          <p className="text-sm text-text-secondary">
            {t('common.last_login')}: {user?.last_login_at ?? t('common.current_session')}
          </p>

          <Button onClick={logout} className="self-start">
            {t('common.logout')}
          </Button>
        </div>
      </div>
    </div>
  )
}
