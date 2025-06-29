'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
  isVisible: boolean
}

export default function Toast({
  message,
  type = 'success',
  duration = 3000,
  onClose,
  isVisible
}: ToastProps) {
  const [isClosing, setIsClosing] = useState(false)
  
  useEffect(() => {
    if (!isVisible) return
    
    const timer = setTimeout(() => {
      setIsClosing(true)
      setTimeout(onClose, 300) // Allow animation to complete
    }, duration)
    
    return () => clearTimeout(timer)
  }, [isVisible, duration, onClose])
  
  // Reset closing state when toast becomes visible again
  useEffect(() => {
    if (isVisible) {
      setIsClosing(false)
    }
  }, [isVisible])
  
  if (!isVisible) return null
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500 dark:text-green-400" size={20} />
      case 'error':
        return <AlertCircle className="text-red-500 dark:text-red-400" size={20} />
      case 'info':
        return <Info className="text-blue-500 dark:text-blue-400" size={20} />
      default:
        return <CheckCircle className="text-green-500 dark:text-green-400" size={20} />
    }
  }
  
  const getAccentColor = () => {
    switch (type) {
      case 'success':
        return 'border-l-green-500'
      case 'error':
        return 'border-l-red-500'
      case 'info':
        return 'border-l-blue-500'
      default:
        return 'border-l-green-500'
    }
  }
  
  return (
    <div 
      className={`fixed top-4 right-4 z-[9999] flex items-center p-3 md:p-4 rounded-lg border-2 border-input shadow-2xl transition-all duration-300 ease-out w-auto max-w-[calc(100vw-2rem)] md:max-w-sm ${getAccentColor()} border-l-4 bg-card ${
        isClosing 
          ? 'opacity-0 translate-x-full scale-95' 
          : 'opacity-100 translate-x-0 scale-100'
      }`}
    >
      <div className="mr-2 md:mr-3 flex-shrink-0">
        {getIcon()}
      </div>
      <p className="text-xs md:text-sm font-medium text-foreground flex-grow pr-1 md:pr-2 leading-relaxed">{message}</p>
      <button 
        onClick={() => {
          setIsClosing(true)
          setTimeout(onClose, 300)
        }}
        className="p-1 md:p-1.5 rounded-full hover:bg-muted transition-colors flex-shrink-0 text-muted-foreground hover:text-foreground ml-1"
        aria-label="Close toast"
      >
        <X size={14} className="md:hidden" />
        <X size={16} className="hidden md:block" />
      </button>
    </div>
  )
}
