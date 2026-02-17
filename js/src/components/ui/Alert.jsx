import { cn } from '../../utils/cn'
import {
  CheckCircleIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
} from '../icons'

const variantConfig = {
  success: {
    classes: 'border-success/20 bg-success/5 text-success-dark',
    Icon: CheckCircleIcon,
  },
  error: {
    classes: 'border-danger/20 bg-danger/5 text-danger-dark',
    Icon: AlertCircleIcon,
  },
  warning: {
    classes: 'border-warning/20 bg-warning/5 text-warning',
    Icon: AlertTriangleIcon,
  },
  info: {
    classes: 'border-info/20 bg-info/5 text-info',
    Icon: InfoIcon,
  },
}

export function Alert({ variant = 'info', children, className }) {
  if (!children) return null

  const { classes, Icon } = variantConfig[variant]

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 border px-4 py-3 text-sm rounded-md',
        classes,
        className,
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
