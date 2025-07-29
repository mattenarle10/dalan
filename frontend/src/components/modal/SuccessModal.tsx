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
        <div 
          className="!bg-background text-foreground rounded-lg shadow-xl max-w-md w-full border border-gray-200 dark:border-white/10 relative overflow-hidden"
          style={{ backgroundColor: 'var(--background)' }}
        >
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
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-5">
              <div className="bg-muted p-4 rounded-lg border">
                <div className="flex items-start">
                  <AlertTriangle size={18} className="text-dalan-yellow mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
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
                <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-dalan-yellow h-full rounded-full transition-all duration-300 ease-in-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                {/* Processing steps */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className={`text-center p-2 rounded-md ${progress > 30 ? 'bg-dalan-yellow/20 text-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <p className="text-xs font-medium">Uploading</p>
                  </div>
                  <div className={`text-center p-2 rounded-md ${progress > 60 ? 'bg-dalan-yellow/20 text-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <p className="text-xs font-medium">Analyzing</p>
                  </div>
                  <div className={`text-center p-2 rounded-md ${progress > 90 ? 'bg-dalan-yellow/20 text-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <p className="text-xs font-medium">Finalizing</p>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground italic mt-2 text-center">
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
      <div 
        className="!bg-background text-foreground rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-white/10 relative"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-400"></div>
        <div className="p-4 md:p-6"> 
          <div className="flex items-start justify-between mb-4 md:mb-6">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mr-3">
                <CheckCircle className="text-green-500" size={20} />
              </div>
              <h2 className="text-lg md:text-xl font-bold">Submission Successful!</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            {/* Entry images - original and classified */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-lg overflow-hidden border">
                <div className="bg-muted text-xs px-2 py-1 text-center">Original Image</div>
                <Image 
                  src={entry.image} 
                  alt={entry.title} 
                  width={300}
                  height={150}
                  className="w-full h-28 md:h-36 object-cover"
                />
              </div>
              
              {entry.classified_image && (
                <div className="rounded-lg overflow-hidden border">
                  <div className="bg-dalan-yellow/20 text-xs px-2 py-1 text-center">AI Classified Image</div>
                  <Image 
                    src={entry.classified_image} 
                    alt={`${entry.title} - Classified`} 
                    width={300}
                    height={150}
                    className="w-full h-28 md:h-36 object-cover"
                  />
                </div>
              )}
            </div>
            
            {/* Entry details */}
            <div>
              <h3 className="font-bold text-base md:text-lg">{entry.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{entry.description}</p>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin size={14} className="mr-1" />
                <span>{entry.location}</span>
              </div>
            </div>
            
            {/* AI Analysis Results - Handle zero cracks case */}
            <div className="bg-dalan-yellow/10 p-4 rounded-lg border border-dalan-yellow/30">
              <h4 className="font-bold mb-2">Detection Summary</h4>
              
              {detectionInfo ? (
                <>
                  {detectionInfo.total_cracks === 0 ? (
                    // No cracks detected state - Mobile optimized
                    <div className="text-center py-2">
                      <div className="bg-card p-3 rounded-lg border mb-3">
                        <div className="flex items-center justify-center mb-2">
                          <div className="bg-muted p-2 rounded-full">
                            <CheckCircle className="text-muted-foreground" size={20} />
                          </div>
                        </div>
                        <h5 className="font-bold mb-2 text-sm">No Road Cracks Detected</h5>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                          Our AI didn&apos;t find any road cracks in this image.
                        </p>
                        
                        <div className="grid grid-cols-1 gap-2 mb-3">
                          <div className="bg-muted p-2 rounded text-left border">
                            <p className="text-xs font-medium mb-1">💡 Quick Tips:</p>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              <li>• Take photos directly above cracks</li>
                              <li>• Ensure good lighting and focus</li>
                              <li>• Image might show good road condition</li>
                            </ul>
                          </div>
                        </div>
                        
                        <div className="bg-muted p-2 rounded border">
                          <p className="text-xs font-medium">
                            Entry saved! You can edit it anytime from your dashboard.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Normal cracks detected state
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
                            <div key={type} className="bg-card p-2 rounded flex-1 min-w-[120px] border">
                              <p className="font-medium text-sm">{type}</p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                <span>{info.count}</span>
                                <span>{info.avg_confidence}%</span>
                              </div>
                              {/* Simple confidence bar */}
                              <div className="w-full bg-muted h-1 mt-1 rounded-full overflow-hidden">
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
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Analysis information not available
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mt-3 md:mt-4">
              <button
                onClick={() => router.push('/map')}
                className="flex-1 flex items-center justify-center py-2 px-3 md:px-4 bg-dalan-yellow text-foreground font-medium rounded-md hover:opacity-90 transition-opacity text-sm"
              >
                View on Map
              </button>
              <button
                onClick={() => router.push(`/details/${entry.id}`)}
                className="flex-1 flex items-center justify-center py-2 px-3 md:px-4 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-md transition-colors text-sm"
              >
                View More Details <ArrowRight size={14} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
