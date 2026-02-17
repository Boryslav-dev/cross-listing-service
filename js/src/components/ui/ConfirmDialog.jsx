import { Dialog } from './Dialog'
import { Button } from './Button'
import { AlertTriangleIcon } from '../icons'

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-danger/10">
          <AlertTriangleIcon size={22} className="text-danger" />
        </div>
        {title && <h3 className="text-base font-semibold">{title}</h3>}
        {message && <p className="text-sm text-text-secondary">{message}</p>}
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          size="sm"
          onClick={() => {
            onConfirm()
            onClose()
          }}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
