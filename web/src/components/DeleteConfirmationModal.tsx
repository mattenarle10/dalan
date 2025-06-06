'use client'

import { X } from 'lucide-react'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  cancelText?: string
  confirmText?: string
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Entry",
  message = "Are you sure you want to delete this entry? This action cannot be undone.",
  cancelText = "Cancel",
  confirmText = "Delete"
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div 
        className="!bg-background text-foreground rounded-lg shadow-lg w-full max-w-md overflow-hidden flex flex-col" 
        style={{ backgroundColor: 'var(--background)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="mb-6">{message}</p>
          
          <div className="flex justify-end space-x-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm"
            >
              {cancelText}
            </button>
            
            <button 
              onClick={onConfirm}
              className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
