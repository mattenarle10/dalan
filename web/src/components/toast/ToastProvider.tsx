'use client'

import React, { createContext, useState, useContext, ReactNode } from 'react'
import Toast, { ToastType } from './Toast'

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<{
    message: string
    type: ToastType
    duration: number
    isVisible: boolean
  }>({
    message: '',
    type: 'success',
    duration: 3000,
    isVisible: false
  })

  const showToast = (message: string, type: ToastType = 'success', duration: number = 3000) => {
    setToast({
      message,
      type,
      duration,
      isVisible: true
    })
  }

  const hideToast = () => {
    setToast(prev => ({
      ...prev,
      isVisible: false
    }))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onClose={hideToast}
        isVisible={toast.isVisible}
      />
    </ToastContext.Provider>
  )
}
