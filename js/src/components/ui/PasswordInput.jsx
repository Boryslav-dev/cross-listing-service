import { forwardRef, useState } from 'react'
import { cn } from '../../utils/cn'
import { VisibilityIcon, VisibilityOffIcon } from '../icons'

export const PasswordInput = forwardRef(function PasswordInput(
  {
    id,
    label,
    error,
    helperText,
    disabled = false,
    size = 'md',
    fullWidth = true,
    className,
    ...rest
  },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={cn('flex flex-col', fullWidth && 'w-full', className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={showPassword ? 'text' : 'password'}
          disabled={disabled}
          className={cn(
            'w-full border bg-white px-3.5 pr-10 font-sans rounded-md transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'disabled:bg-gray-50 disabled:text-text-disabled disabled:cursor-not-allowed',
            'placeholder:text-text-disabled',
            error ? 'border-danger' : 'border-divider',
            size === 'sm' ? 'py-2 text-sm' : 'py-2.5 text-sm',
          )}
          {...rest}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-text-secondary hover:text-text-primary hover:bg-gray-100 transition-colors"
        >
          {showPassword ? <VisibilityOffIcon size={18} /> : <VisibilityIcon size={18} />}
        </button>
      </div>
      {(error || helperText) && (
        <p className={cn('mt-1 min-h-5 text-xs', error ? 'text-danger' : 'text-text-secondary')}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})
