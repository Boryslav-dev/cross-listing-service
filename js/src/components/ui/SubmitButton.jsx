import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import { useI18n } from '../../i18n/useI18n'

export function SubmitButton({ children, isLoading, disabled, ...props }) {
  const { t } = useI18n()

  return (
    <Button
      type="submit"
      variant="contained"
      size="large"
      fullWidth
      disabled={isLoading || disabled}
      {...props}
    >
      <Stack direction="row" spacing={1.2} alignItems="center">
        {isLoading ? <CircularProgress size={18} color="inherit" /> : null}
        <span>{isLoading ? t('buttons.loading') : children}</span>
      </Stack>
    </Button>
  )
}
