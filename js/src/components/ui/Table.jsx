import { cn } from '../../utils/cn'

export function Table({ children, className }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  )
}

export function TableHead({ children, className }) {
  return <thead className={cn('bg-gray-50/70', className)}>{children}</thead>
}

export function TableBody({ children, className }) {
  return <tbody className={cn('divide-y divide-divider/60', className)}>{children}</tbody>
}

export function TableRow({ children, hover = false, className }) {
  return (
    <tr className={cn(hover && 'hover:bg-primary/[0.02] transition-colors', className)}>
      {children}
    </tr>
  )
}

export function TableCell({ children, align = 'left', colSpan, className }) {
  return (
    <td
      className={cn(
        'px-4 py-3',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
      colSpan={colSpan}
    >
      {children}
    </td>
  )
}

export function TableHeaderCell({ children, align = 'left', className }) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </th>
  )
}
