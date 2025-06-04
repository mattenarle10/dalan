'use client'

import { X, MapPin, CheckCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { RoadCrackEntry } from '@/context/DataContext'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  entry: RoadCrackEntry
}

export default function SuccessModal({ isOpen, onClose, entry }: SuccessModalProps) {
  const router = useRouter()
  
  if (!isOpen) return null
  
  // Mock AI analysis results
  const mockAnalysis = {
    type: entry.type || 'Longitudinal Crack',
    confidence: '92%',
    severity: entry.severity,
    estimatedRepairCost: entry.severity === 'minor' ? '$200-$400' : '$800-$1,200',
    recommendedAction: entry.severity === 'minor' 
      ? 'Schedule maintenance within 3 months' 
      : 'Immediate repair recommended'
  }
  
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
            {/* Entry image */}
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img 
                src={entry.image} 
                alt={entry.title} 
                className="w-full h-48 object-cover"
              />
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
            
            {/* AI Analysis Results */}
            <div className="bg-dalan-pastel-yellow/30 p-4 rounded-lg border border-dalan-yellow">
              <h4 className="font-bold mb-2">AI Analysis Results</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Crack Type:</p>
                  <p className="font-medium">{mockAnalysis.type}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Confidence:</p>
                  <p className="font-medium">{mockAnalysis.confidence}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Severity:</p>
                  <p className="font-medium capitalize">{mockAnalysis.severity}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Est. Repair Cost:</p>
                  <p className="font-medium">{mockAnalysis.estimatedRepairCost}</p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Recommendation:</p>
                <p className="text-sm font-medium">{mockAnalysis.recommendedAction}</p>
              </div>
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
