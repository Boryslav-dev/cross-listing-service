import { forwardRef } from 'react'
import TextField from '@mui/material/TextField'

export const InputField = forwardRef(function InputField(
  {
    id,
    label,
    error,
    helperText,
    disabled,
    className = '',
    size = 'medium',
    ...props
  },
  ref,
) {
  return (
    <TextField
      id={id}
      label={label}
      fullWidth
      size={size}
      disabled={disabled}
      error={Boolean(error)}
      helperText={error || helperText || ' '}
      inputRef={ref}
      className={className}
      {...props}
    />
  )
})
