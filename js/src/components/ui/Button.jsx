import { forwardRef } from 'react'
import { cn } from '../../utils/cn'
import { Spinner } from './Spinner'

const variantClasses = {
  primary:
    'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md',
  secondary:
    'bg-secondary text-white hover:bg-secondary-dark shadow-sm hover:shadow-md',
  outline:
    'border border-divider text-text-primary bg-white hover:bg-gray-50 shadow-sm',
  danger:
    'border border-danger/30 text-danger bg-white hover:bg-danger/5',
  ghost:
    'text-text-secondary hover:bg-gray-100 hover:text-text-primary',
}

const sizeClasses = {
  xs: 'px-2 py-1 text-[11px] gap-1',
  sm: 'px-3.5 py-2 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
}

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    isLoading = false,
    startIcon,
    endIcon,
    type = 'button',
    href,
    className,
    children,
    ...rest
  },
  ref,
) {
  const classes = cn(
    'inline-flex items-center justify-center font-semibold rounded-md transition-all duration-150',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    className,
  )

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {startIcon && <span className="shrink-0">{startIcon}</span>}
        {children}
        {endIcon && <span className="shrink-0">{endIcon}</span>}
      </a>
    )
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={classes}
      {...rest}
    >
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        startIcon && <span className="shrink-0">{startIcon}</span>
      )}
      {children}
      {endIcon && <span className="shrink-0">{endIcon}</span>}
    </button>
  )
})
