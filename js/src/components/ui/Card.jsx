import { cn } from '../../utils/cn'

export function Card({ children, padding = true, className, ...props }) {
  return (
    <div
      className={cn(
        'bg-surface border border-divider/60 rounded-lg shadow-sm overflow-hidden',
        padding && 'p-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
