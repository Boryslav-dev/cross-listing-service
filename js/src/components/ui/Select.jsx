import { useState, useRef, useEffect, useCallback, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'
import { ExpandMoreIcon } from '../icons'

export const Select = forwardRef(function Select(
  {
    id,
    label,
    value,
    onChange,
    options = [],
    error,
    disabled = false,
    size = 'md',
    fullWidth = false,
    placeholder,
    className,
  },
  ref,
) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const containerRef = useRef(null)
  const triggerRef = useRef(null)

  const selectedOption = options.find((opt) => String(opt.value) === String(value))
  const displayLabel = selectedOption?.label || placeholder || ''

  const DROPDOWN_MAX_H = 240 // max-h-60 = 240px
  const GAP = 6

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    const openUpward = spaceBelow < DROPDOWN_MAX_H + GAP && spaceAbove > spaceBelow

    setDropdownStyle(
      openUpward
        ? { position: 'fixed', bottom: window.innerHeight - rect.top + GAP, left: rect.left, width: rect.width }
        : { position: 'fixed', top: rect.bottom + GAP, left: rect.left, width: rect.width },
    )
  }, [])

  useEffect(() => {
    if (!open) return

    updatePosition()

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  const handleSelect = (optValue) => {
    onChange(optValue)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative flex flex-col', fullWidth && 'w-full', className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <button
        ref={(node) => {
          triggerRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center justify-between w-full border bg-white px-3.5 font-sans rounded-md transition-all duration-150 text-left gap-2',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
          'disabled:bg-gray-50 disabled:text-text-disabled disabled:cursor-not-allowed',
          error
            ? 'border-danger'
            : open
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-divider hover:border-gray-300',
          size === 'sm' ? 'py-2 text-sm' : 'py-2.5 text-sm',
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-text-disabled')}>
          {displayLabel}
        </span>
        <ExpandMoreIcon
          size={16}
          className={cn(
            'shrink-0 text-text-secondary transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open &&
        createPortal(
          <div
            className="z-[9999] bg-white border border-divider/60 rounded-md shadow-lg py-1 max-h-60 overflow-auto animate-dropdown-in"
            style={dropdownStyle}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {options.map((opt) => {
              const isSelected = String(value) === String(opt.value)

              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'flex items-center justify-between w-full text-left px-3.5 py-2 text-sm transition-colors rounded-sm mx-auto',
                    'hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed',
                    isSelected
                      ? 'text-primary font-medium bg-primary/5'
                      : 'text-text-primary',
                  )}
                  style={{ width: 'calc(100% - 8px)', marginLeft: '4px' }}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-primary">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>,
          document.body,
        )}

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
})
