'use client'

import { X } from 'lucide-react'
import Modal from "@/components/modal/Modal";

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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
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
    </Modal>
  )
}
