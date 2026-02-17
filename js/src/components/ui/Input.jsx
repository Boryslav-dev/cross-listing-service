import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

export const Input = forwardRef(function Input(
  {
    id,
    label,
    type = 'text',
    placeholder,
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
  return (
    <div className={cn('flex flex-col', fullWidth && 'w-full', className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full border bg-white px-3.5 font-sans rounded-md transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          'disabled:bg-gray-50 disabled:text-text-disabled disabled:cursor-not-allowed',
          'placeholder:text-text-disabled',
          error ? 'border-danger' : 'border-divider',
          size === 'sm' ? 'py-2 text-sm' : 'py-2.5 text-sm',
        )}
        {...rest}
      />
      {(error || helperText) && (
        <p className={cn('mt-1 min-h-5 text-xs', error ? 'text-danger' : 'text-text-secondary')}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})
