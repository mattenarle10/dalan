'use client'

import { X, MapPin, CheckCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { RoadCrackEntry } from '@/context/DataContext'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  entry: RoadCrackEntry
}

export default function SuccessModal({ isOpen, onClose, entry }: SuccessModalProps) {
  const router = useRouter()
  
  if (!isOpen) return null
  
  // Use the actual detection info from the API response
  const detectionInfo = entry.detection_info
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="!bg-background text-foreground rounded-lg shadow-lg max-w-md w-full border border-border relative overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
        <div className="p-6"> 
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <CheckCircle className="text-green-500 mr-2" size={24} />
              <h2 className="text-xl font-bold">Submission Successful!</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Entry images - original and classified */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="bg-gray-100 dark:bg-gray-800 text-xs px-2 py-1 text-center">Original Image</div>
                <Image 
                  src={entry.image} 
                  alt={entry.title} 
                  width={300}
                  height={150}
                  className="w-full h-36 object-cover"
                />
              </div>
              
              {entry.classified_image && (
                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="bg-dalan-yellow/20 text-xs px-2 py-1 text-center">AI Classified Image</div>
                  <Image 
                    src={entry.classified_image} 
                    alt={`${entry.title} - Classified`} 
                    width={300}
                    height={150}
                    className="w-full h-36 object-cover"
                  />
                </div>
              )}
            </div>
            
            {/* Entry details */}
            <div>
              <h3 className="font-bold text-lg">{entry.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{entry.description}</p>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <MapPin size={14} className="mr-1" />
                <span>{entry.location}</span>
              </div>
            </div>
            
            {/* AI Analysis Results - Simplified for mobile */}
            <div className="bg-dalan-pastel-yellow/30 p-4 rounded-lg border border-dalan-yellow">
              <h4 className="font-bold mb-2">Detection Summary</h4>
              
              {detectionInfo ? (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">Total Cracks:</span>
                    <span className="font-bold">{detectionInfo.total_cracks}</span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Primary Type: <span className="font-bold">{entry.type}</span></p>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Detected Types:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(detectionInfo.crack_types).map(([type, info]) => (
                        <div key={type} className="bg-white/50 dark:bg-gray-800/50 p-2 rounded flex-1 min-w-[120px]">
                          <p className="font-medium text-sm">{type}</p>
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                            <span>{info.count}</span>
                            <span>{info.avg_confidence}%</span>
                          </div>
                          {/* Simple confidence bar */}
                          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 mt-1 rounded-full overflow-hidden">
                            <div 
                              className="bg-dalan-yellow h-full rounded-full" 
                              style={{ width: `${info.avg_confidence}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Analysis information not available
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={() => router.push('/map')}
                className="flex-1 flex items-center justify-center py-2 px-4 bg-dalan-yellow text-black font-medium rounded-md hover:opacity-90 transition-opacity"
              >
                View on Map
              </button>
              <button
                onClick={() => router.push(`/details/${entry.id}`)}
                className="flex-1 flex items-center justify-center py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition-colors"
              >
                View More Details <ArrowRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
