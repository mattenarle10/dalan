'use client'

import { useState } from 'react'
import Modal from "@/components/modal/Modal"; 

interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: EditFormData) => void
  initialData: EditFormData
  title?: string
  cancelText?: string
  submitText?: string
}

export interface EditFormData {
  title: string
  description: string
  severity: 'minor' | 'major'
}

export default function EditModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = "Edit Entry",
  cancelText = "Cancel",
  submitText = "Save Changes"
}: EditModalProps) {
  const [formData, setFormData] = useState<EditFormData>(initialData)
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prevData => ({
      ...prevData,
      [e.target.name]: e.target.value
    }))
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
            required
          />
        </div>
        
        <div>
          <label htmlFor="severity" className="block text-sm font-medium mb-1">Severity</label>
          <select
            id="severity"
            name="severity"
            value={formData.severity}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
            required
          >
            <option value="minor">Minor</option>
            <option value="major">Major</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-3 pt-2">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-input bg-background text-foreground text-sm hover:bg-accent hover:text-accent-foreground"
          >
            {cancelText}
          </button>
          
          <button 
            type="submit"
            className="px-4 py-2 rounded-md bg-dalan-yellow text-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {submitText}
          </button>
        </div>
      </form>
    </Modal>
  )
}
