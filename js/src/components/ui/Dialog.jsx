import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

const maxWidthClasses = {
  xs: 'max-w-sm',
  sm: 'max-w-lg',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
}

export function Dialog({ open, onClose, title, children, actions, maxWidth = 'sm', className }) {
  useEffect(() => {
    if (!open) return

    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'w-full bg-surface rounded-xl shadow-xl',
            maxWidthClasses[maxWidth],
            className,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="border-b border-divider/60 px-6 py-4">
              <h2 className="text-lg font-semibold">{title}</h2>
            </div>
          )}
          <div className="px-6 py-5">{children}</div>
          {actions && (
            <div className="flex justify-end gap-2 border-t border-divider/60 px-6 py-4">
              {actions}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}
