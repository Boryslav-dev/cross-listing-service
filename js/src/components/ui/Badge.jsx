import { cn } from '../../utils/cn'

const variantClasses = {
  default: 'bg-gray-100 text-text-primary',
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
}

const sizeClasses = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base font-semibold',
}

export function Badge({ variant = 'default', size = 'md', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        sizeClasses[size] ?? sizeClasses.md,
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
