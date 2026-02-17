import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

export const Textarea = forwardRef(function Textarea(
  {
    id,
    label,
    error,
    helperText,
    disabled = false,
    rows = 4,
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
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        disabled={disabled}
        className={cn(
          'w-full resize-y border bg-white px-3.5 py-2.5 text-sm font-sans rounded-md transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          'disabled:bg-gray-50 disabled:text-text-disabled disabled:cursor-not-allowed',
          'placeholder:text-text-disabled',
          error ? 'border-danger' : 'border-divider',
        )}
        {...rest}
      />
      {(error || helperText) && (
        <p className={cn('mt-1 text-xs', error ? 'text-danger' : 'text-text-secondary')}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})
