'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

interface ImageViewerProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  altText: string
}

export default function ImageViewer({ isOpen, onClose, imageUrl, altText }: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  
  if (!isOpen) return null
  
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3))
  }
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }
  
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl mx-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          aria-label="Close image viewer"
        >
          <X size={20} />
        </button>
        
        {/* Image container */}
        <div className="relative overflow-auto bg-black/30 rounded-lg p-2 max-h-[80vh] flex items-center justify-center">
          <Image
            src={imageUrl}
            alt={altText}
            width={1200}
            height={800}
            className="max-w-full max-h-[75vh] object-contain transition-transform duration-200" 
            style={{ 
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
            unoptimized // Use unoptimized for zooming/rotation functionality
          />
        </div>
        
        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 bg-black/50 rounded-full px-4 py-2">
          <button
            onClick={handleZoomIn}
            className="p-2 text-white hover:text-dalan-yellow transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-white hover:text-dalan-yellow transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 text-white hover:text-dalan-yellow transition-colors"
            aria-label="Rotate image"
          >
            <RotateCw size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
