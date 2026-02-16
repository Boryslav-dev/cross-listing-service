import { forwardRef, useState } from 'react'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

export const PasswordField = forwardRef(function PasswordField(
  { id, label, error, helperText, disabled, ...props },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <TextField
      id={id}
      label={label}
      fullWidth
      type={showPassword ? 'text' : 'password'}
      disabled={disabled}
      error={Boolean(error)}
      helperText={error || helperText || ' '}
      inputRef={ref}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShowPassword((prev) => !prev)}
              edge="end"
              disabled={disabled}
              aria-label="toggle password visibility"
            >
              {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...props}
    />
  )
})
