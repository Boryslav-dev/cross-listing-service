import { cn } from '../../utils/cn'

export function Collapse({ open, children, className }) {
  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows] duration-200 ease-in-out',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        className,
      )}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  )
}
