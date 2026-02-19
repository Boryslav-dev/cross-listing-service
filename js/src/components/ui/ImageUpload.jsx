import { useRef, useState } from 'react'
import { cn } from '../../utils/cn'
import { useWorkspace } from '../../workspaces/useWorkspace'
import { uploadProductImage } from '../../api/products'
import { Button, IconButton, Spinner } from './index'
import { UploadIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from '../icons'
import toast from 'react-hot-toast'

export function ImageUpload({ value = [], onChange, maxFiles = 10, disabled = false }) {
  const { currentWorkspaceId } = useWorkspace()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (files) => {
    if (disabled || !files || files.length === 0) return

    if (value.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`)
      return
    }

    setUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await uploadProductImage(currentWorkspaceId, file)
        return {
          url: result.url,
          path: result.path,
          sort_order: value.length,
        }
      })

      const uploadedImages = await Promise.all(uploadPromises)
      const newImages = [...value, ...uploadedImages].map((img, idx) => ({
        ...img,
        sort_order: idx,
      }))

      onChange(newImages)
      toast.success('Images uploaded')
    } catch (error) {
      toast.error('Failed to upload images')
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleRemove = (index) => {
    const newImages = value.filter((_, i) => i !== index).map((img, idx) => ({
      ...img,
      sort_order: idx,
    }))
    onChange(newImages)
  }

  const handleMoveLeft = (index) => {
    if (index === 0) return
    const newImages = [...value]
    const temp = newImages[index]
    newImages[index] = newImages[index - 1]
    newImages[index - 1] = temp
    onChange(newImages.map((img, idx) => ({ ...img, sort_order: idx })))
  }

  const handleMoveRight = (index) => {
    if (index === value.length - 1) return
    const newImages = [...value]
    const temp = newImages[index]
    newImages[index] = newImages[index + 1]
    newImages[index + 1] = temp
    onChange(newImages.map((img, idx) => ({ ...img, sort_order: idx })))
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileInputChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary hover:bg-surface-hover',
          (disabled || uploading) && 'cursor-not-allowed opacity-50',
        )}
      >
        {uploading ? (
          <>
            <Spinner size="md" />
            <p className="mt-2 text-sm text-text-secondary">Uploading...</p>
          </>
        ) : (
          <>
            <UploadIcon size={32} className="text-text-secondary" />
            <p className="mt-2 text-sm font-medium">Click to upload or drag and drop</p>
            <p className="mt-1 text-xs text-text-secondary">
              PNG, JPG, WEBP up to 5MB (max {maxFiles} images)
            </p>
          </>
        )}
      </div>

      {/* Image Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((image, index) => (
            <div key={image.url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
              <img
                src={image.url}
                alt={`Product ${index + 1}`}
                className="h-full w-full object-cover"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <IconButton
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveLeft(index)
                  }}
                  disabled={index === 0 || disabled}
                  className="bg-white/90 text-text-primary hover:bg-white"
                  title="Move left"
                >
                  <ChevronLeftIcon size={16} />
                </IconButton>

                <IconButton
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveRight(index)
                  }}
                  disabled={index === value.length - 1 || disabled}
                  className="bg-white/90 text-text-primary hover:bg-white"
                  title="Move right"
                >
                  <ChevronRightIcon size={16} />
                </IconButton>

                <IconButton
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(index)
                  }}
                  disabled={disabled}
                  className="bg-danger/90 text-white hover:bg-danger"
                  title="Remove"
                >
                  <TrashIcon size={16} />
                </IconButton>
              </div>

              {/* Sort order badge */}
              <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
