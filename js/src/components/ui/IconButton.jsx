import { cn } from '../../utils/cn'

const sizeClasses = {
  sm: 'p-1.5',
  md: 'p-2',
}

export function IconButton({
  children,
  onClick,
  disabled = false,
  title,
  size = 'md',
  className,
  ...rest
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center text-text-secondary rounded-full hover:bg-gray-100 hover:text-text-primary transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...rest}
    >
      {children}
    </button>
  )
}
