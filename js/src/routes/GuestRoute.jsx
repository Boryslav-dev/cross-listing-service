import { Navigate } from 'react-router-dom'
import { Spinner } from '../components/ui'
import { useAuth } from '../auth/useAuth'
import { useI18n } from '../i18n/useI18n'

export function GuestRoute({ children }) {
  const { isLoading, isAuthenticated } = useAuth()
  const { t } = useI18n()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-teal-50/30">
        <div className="bg-surface rounded-lg shadow-md border border-divider/40 p-8 flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm">{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return children
}
