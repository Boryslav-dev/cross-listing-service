import { cn } from '../../utils/cn'
import { Select } from './Select'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons'

export function Pagination({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 20, 50],
  className,
}) {
  const from = count === 0 ? 0 : page * rowsPerPage + 1
  const to = Math.min((page + 1) * rowsPerPage, count)

  return (
    <div className={cn('flex items-center justify-between border-t border-divider/60 px-4 py-3', className)}>
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span>Rows per page:</span>
        <Select
          size="sm"
          value={rowsPerPage}
          onChange={(val) => onRowsPerPageChange(Number(val))}
          options={rowsPerPageOptions.map((n) => ({ value: n, label: String(n) }))}
        />
      </div>
      <div className="flex items-center gap-1 text-sm text-text-secondary">
        <span className="mr-1">
          {from}–{to} of {count}
        </span>
        <button
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeftIcon size={16} />
        </button>
        <button
          disabled={to >= count}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </div>
  )
}
