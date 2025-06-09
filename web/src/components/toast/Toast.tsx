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
  
  if (!isVisible) return null
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={18} />
      case 'error':
        return <AlertCircle className="text-red-500" size={18} />
      case 'info':
        return <Info className="text-blue-500" size={18} />
      default:
        return <CheckCircle className="text-green-500" size={18} />
    }
  }
  
  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    }
  }
  
  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 flex items-center p-3 pr-4 rounded-md border shadow-sm transition-all duration-300 ${getBgColor()} ${isClosing ? 'opacity-0 translate-y-2' : 'opacity-100'}`}
    >
      <div className="mr-2">
        {getIcon()}
      </div>
      <p className="text-sm font-medium mr-4">{message}</p>
      <button 
        onClick={() => {
          setIsClosing(true)
          setTimeout(onClose, 300)
        }}
        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
      >
        <X size={16} />
      </button>
    </div>
  )
}
