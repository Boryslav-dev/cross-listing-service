import Alert from '@mui/material/Alert'

export function Banner({ variant = 'error', children }) {
  if (!children) {
    return null
  }

  const severity = variant === 'success' ? 'success' : 'error'

  return (
    <Alert severity={severity} variant="outlined">
      {children}
    </Alert>
  )
}
