import { cn } from '../../utils/cn'

export function Divider({ children, className }) {
  if (children) {
    return (
      <div className={cn('flex items-center gap-3 my-4', className)}>
        <div className="flex-1 border-t border-divider" />
        <span className="text-sm text-text-secondary">{children}</span>
        <div className="flex-1 border-t border-divider" />
      </div>
    )
  }

  return <hr className={cn('border-t border-divider my-4', className)} />
}
