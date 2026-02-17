import { useI18n } from '../../i18n/useI18n'
import { LanguageSwitcher } from '../ui'

export function AuthCardLayout({ title, subtitle, children, footer }) {
  const { t } = useI18n()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-teal-50/30">
      <div className="w-full max-w-[460px] bg-surface rounded-xl shadow-lg border border-divider/40">
        <div className="flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex justify-between items-start gap-3">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
              {t('app.name')}
            </span>
            <LanguageSwitcher compact />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-text-secondary">{subtitle}</p>
          </div>

          <div className="flex flex-col gap-4">{children}</div>

          {footer && (
            <div className="flex flex-col gap-2 text-sm text-text-secondary">{footer}</div>
          )}
        </div>
      </div>
    </div>
  )
}
