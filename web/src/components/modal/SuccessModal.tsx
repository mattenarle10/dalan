'use client'

import { X, MapPin, CheckCircle, ArrowRight, Loader, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { SuccessModalProps } from '@/lib/interface'

export default function SuccessModal({ isOpen, onClose, entry, isLoading = false, progress = 0 }: SuccessModalProps) {
  const router = useRouter()
  
  if (!isOpen) return null
  
  // Loading state UI
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="!bg-background text-foreground rounded-lg shadow-xl max-w-md w-full border border-border relative overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-dalan-yellow via-amber-400 to-dalan-yellow bg-size-200 animate-gradient-x"></div>
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-dalan-yellow/20 p-2 rounded-full mr-3">
                  <Loader className="text-dalan-yellow animate-spin" size={24} />
                </div>
                <h2 className="text-xl font-bold">Processing Submission...</h2>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-full p-1 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-5">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-start">
                  <AlertTriangle size={18} className="text-dalan-yellow mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Your road crack report is being processed. Our AI is analyzing your image to detect and classify cracks.
                  </p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-6 mb-2">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Processing Image</span>
                  <span className="font-bold">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-dalan-yellow h-full rounded-full transition-all duration-300 ease-in-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                {/* Processing steps */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className={`text-center p-2 rounded-md ${progress > 30 ? 'bg-dalan-yellow/20 text-black dark:text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    <p className="text-xs font-medium">Uploading</p>
                  </div>
                  <div className={`text-center p-2 rounded-md ${progress > 60 ? 'bg-dalan-yellow/20 text-black dark:text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    <p className="text-xs font-medium">Analyzing</p>
                  </div>
                  <div className={`text-center p-2 rounded-md ${progress > 90 ? 'bg-dalan-yellow/20 text-black dark:text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    <p className="text-xs font-medium">Finalizing</p>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 italic mt-2 text-center">
                <p>Please don&apos;t close this window while processing.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Success state - ensure entry exists
  if (!entry) return null;
  
  // Use the actual detection info from the API response
  const detectionInfo = entry.detection_info
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="!bg-background text-foreground rounded-lg shadow-xl max-w-md w-full border border-border relative overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-400"></div>
        <div className="p-6"> 
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mr-3">
                <CheckCircle className="text-green-500" size={24} />
              </div>
              <h2 className="text-xl font-bold">Submission Successful!</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-full p-1 transition-colors"
            >
              <X size={18} />
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
