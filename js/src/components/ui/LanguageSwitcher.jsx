import { MenuItem, Select, Stack, Typography } from '@mui/material'
import { useI18n } from '../../i18n/useI18n'

export function LanguageSwitcher({ compact = false }) {
  const { locale, setLocale, supportedLocales, t } = useI18n()

  return (
    <Stack direction={compact ? 'row' : 'column'} spacing={0.5}>
      {!compact ? (
        <Typography variant="caption" color="text.secondary">
          {t('locale.label')}
        </Typography>
      ) : null}
      <Select
        size="small"
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        sx={{ minWidth: compact ? 130 : 150 }}
      >
        {supportedLocales.map((value) => (
          <MenuItem key={value} value={value}>
            {t(`locale.${value}`)}
          </MenuItem>
        ))}
      </Select>
    </Stack>
  )
}
