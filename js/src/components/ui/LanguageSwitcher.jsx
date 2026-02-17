import { useI18n } from '../../i18n/useI18n'
import { Select } from './Select'
import { cn } from '../../utils/cn'

export function LanguageSwitcher({ compact = false, className }) {
  const { locale, setLocale, supportedLocales, t } = useI18n()

  return (
    <div className={cn(compact ? 'flex items-center gap-1' : 'flex flex-col gap-1', className)}>
      {!compact && (
        <span className="text-xs text-text-secondary">{t('locale.label')}</span>
      )}
      <Select
        size="sm"
        value={locale}
        onChange={(val) => setLocale(val)}
        options={supportedLocales.map((value) => ({
          value,
          label: t(`locale.${value}`),
        }))}
        className={compact ? 'min-w-[130px]' : 'min-w-[150px]'}
      />
    </div>
  )
}
