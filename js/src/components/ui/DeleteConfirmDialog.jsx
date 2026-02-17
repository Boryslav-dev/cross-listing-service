import { useState } from 'react'
import { Dialog } from './Dialog'
import { Button } from './Button'
import { Input } from './Input'
import { AlertTriangleIcon } from '../icons'

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  requiredText,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isLoading = false,
  placeholder = 'Type to confirm',
  helperText,
}) {
  const [confirmText, setConfirmText] = useState('')

  const isConfirmEnabled = confirmText === requiredText && !isLoading

  const handleClose = () => {
    setConfirmText('')
    onClose()
  }

  const handleConfirm = () => {
    if (isConfirmEnabled) {
      onConfirm()
      setConfirmText('')
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-danger/10">
          <AlertTriangleIcon size={22} className="text-danger" />
        </div>
        {title && <h3 className="text-base font-semibold">{title}</h3>}
        {message && <p className="text-sm text-text-secondary">{message}</p>}
      </div>
      <div className="mt-4">
        <Input
          size="sm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={placeholder}
          helperText={helperText || `Type ${requiredText} to confirm`}
          disabled={isLoading}
          autoFocus
        />
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="ghost" size="sm" onClick={handleClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={handleConfirm}
          isLoading={isLoading}
          disabled={!isConfirmEnabled}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
