'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, AlertTriangle } from 'lucide-react'
import { useData, RoadCrackEntry } from '@/context/DataContext'
import dynamic from 'next/dynamic'

// Dynamically import Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false, 
  loading: () => <div className="w-full h-60 bg-gray-100 animate-pulse rounded-lg"></div> 
})

export default function DetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { entries } = useData()
  const [entry, setEntry] = useState<RoadCrackEntry | null>(null)
  
  useEffect(() => {
    if (params.id && entries.length > 0) {
      const foundEntry = entries.find(e => e.id === params.id)
      setEntry(foundEntry || null)
    }
  }, [params.id, entries])
  
  // Mock AI analysis results
  const mockAnalysis = entry ? {
    type: entry.type || 'Longitudinal Crack',
    confidence: '92%',
    severity: entry.severity,
    estimatedRepairCost: entry.severity === 'minor' ? '$200-$400' : '$800-$1,200',
    recommendedAction: entry.severity === 'minor' 
      ? 'Schedule maintenance within 3 months' 
      : 'Immediate repair recommended'
  } : null
  
  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <AlertTriangle className="mx-auto text-amber-500 mb-4" size={48} />
          <h1 className="text-xl font-bold mb-2">Entry Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The road crack entry you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center justify-center mx-auto py-2 px-4 bg-dalan-yellow text-black font-medium rounded-md hover:opacity-90 transition-opacity"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }
  
  // Format date
  const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto p-4 pt-20 pb-24 md:pt-24 md:pb-8">
      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Dashboard
      </button>
      
      <div className="bg-card text-foreground rounded-lg shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
        {/* Image */}
        <div className="w-full h-64 md:h-80 relative">
          <img 
            src={entry.image} 
            alt={entry.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <h1 className="text-white text-2xl font-bold">{entry.title}</h1>
            <div className="flex items-center text-white/80 text-sm mt-1">
              <MapPin size={14} className="mr-1" />
              <span>{entry.location}</span>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Meta information */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Calendar size={14} className="mr-1" />
              <span>Reported on {formattedDate}</span>
            </div>
            <div className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 flex items-center">
              <span className="capitalize">{entry.severity} Severity</span>
            </div>
            <div className="px-2 py-1 rounded-full bg-dalan-pastel-yellow/50 text-gray-800 flex items-center">
              <span>{entry.type}</span>
            </div>
          </div>
          
          {/* Reporter information */}
          <div className="flex items-center mb-6 bg-card text-foreground border border-gray-200 dark:border-white/10 p-3 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-3 flex-shrink-0">
              {entry.user.name === 'Matthew Enarle' ? (
                <img 
                  src="/placeholders/matt.png" 
                  alt="Matthew Enarle" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  {entry.user.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center">
                <p className="font-medium">Reported by {entry.user.name}</p>
                {entry.user.isCurrentUser && (
                  <span className="ml-2 text-xs bg-dalan-yellow/20 text-dalan-yellow px-2 py-0.5 rounded-full">
                    You
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Community Member</p>
            </div>
          </div>
          
          {/* Description */}
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-2">Description</h2>
            <p className="text-gray-700 dark:text-gray-300">{entry.description}</p>
          </div>
          
          {/* Map */}
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-2">Location</h2>
            <div className="h-60 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
              <Map 
                initialCenter={entry.coordinates}
                zoom={16}
                markers={[{ position: entry.coordinates, popup: entry.title }]}
              />
            </div>
          </div>
          
          {/* AI Analysis */}
          <div className="bg-dalan-pastel-yellow/30 p-4 rounded-lg border border-dalan-yellow mb-6">
            <h2 className="text-lg font-medium mb-4">AI Analysis Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm text-gray-600 dark:text-gray-400">Crack Type</h3>
                <p className="font-medium">{mockAnalysis?.type}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-600 dark:text-gray-400">Confidence</h3>
                <p className="font-medium">{mockAnalysis?.confidence}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-600 dark:text-gray-400">Severity</h3>
                <p className="font-medium capitalize">{mockAnalysis?.severity}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-600 dark:text-gray-400">Estimated Repair Cost</h3>
                <p className="font-medium">{mockAnalysis?.estimatedRepairCost}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-dalan-yellow/30">
              <h3 className="text-sm text-gray-600 dark:text-gray-400">Recommended Action</h3>
              <p className="font-medium">{mockAnalysis?.recommendedAction}</p>
            </div>
          </div>
          
          {/* Action button */}
          <div className="flex">
            <button
              onClick={() => router.push('/map')}
              className="flex items-center justify-center py-2 px-4 bg-dalan-yellow text-black font-medium rounded-md hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              View on Map
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
