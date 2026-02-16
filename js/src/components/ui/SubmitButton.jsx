import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'

export function SubmitButton({ children, isLoading, disabled, ...props }) {
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
        <span>{isLoading ? 'Загрузка...' : children}</span>
      </Stack>
    </Button>
  )
}
