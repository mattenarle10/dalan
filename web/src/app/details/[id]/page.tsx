'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, AlertTriangle, Edit, Trash2, X, Check } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEntry } from '@/lib/swr-hooks'
import Modal from '@/components/Modal'

type CrackTypeInfo = { count: number; avg_confidence: number }

// Dynamically import Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false, 
  loading: () => <div className="w-full h-60 bg-gray-100 animate-pulse rounded-lg"></div> 
})

export default function DetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { entry: originalEntry, isLoading: isLoadingEntry, updateEntryData, deleteEntryData } = useEntry(params.id as string)
  
  // Create a modified entry object that always treats the current user as the owner
  const entry = originalEntry ? {
    ...originalEntry,
    user: originalEntry.user ? {
      ...originalEntry.user,
      isCurrentUser: true // Always set isCurrentUser to true
    } : { isCurrentUser: true, name: 'Current User' }
  } : null
  
  // State for edit mode and delete confirmation
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string;
    severity: 'minor' | 'major';
  } | null>(null)
  
  // Define all useCallback hooks at the top level to avoid conditional rendering
  // This empty function will be used when editFormData is null
  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editFormData) return
    
    setEditFormData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        [e.target.name]: e.target.value
      };
    })
  }, [])
  
  // Handle form submission
  const handleUpdateSubmit = useCallback(async () => {
    if (!editFormData) return
    
    try {
      await updateEntryData(editFormData)
      setIsEditMode(false)
    } catch (err) {
      console.error('Failed to update entry:', err)
      // Could add error handling UI here
    }
  }, [editFormData, updateEntryData])
  
  // Handle delete
  const handleDelete = useCallback(async () => {
    try {
      await deleteEntryData()
      router.push('/dashboard')
    } catch (err) {
      console.error('Failed to delete entry:', err)
      setIsDeleteModalOpen(false)
      // Could add error handling UI here
    }
  }, [deleteEntryData, router])
  
  // Initialize edit form data when entry is loaded
  useEffect(() => {
    if (originalEntry) {
      setEditFormData({
        title: originalEntry.title,
        description: originalEntry.description,
        severity: originalEntry.severity
      })
    }
  }, [originalEntry])
  
  // Get detection info from the entry
  const detectionInfo = entry?.detection_info
  
  // Loading skeleton
  if (isLoadingEntry) {
    return (
      <div className="flex flex-col w-full max-w-3xl mx-auto p-4 pt-20 pb-24 md:pt-24 md:pb-8">
        {/* Back button skeleton */}
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse"></div>
        
        <div className="bg-card text-foreground rounded-lg shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
          {/* Images skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="w-full h-64 md:h-80 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            <div className="w-full h-64 md:h-80 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          </div>
          
          {/* Content skeleton */}
          <div className="p-6">
            <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse"></div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse"></div>
            
            {/* Map skeleton */}
            <div className="h-60 w-full bg-gray-200 dark:bg-gray-700 rounded-lg mb-8 animate-pulse"></div>
            
            {/* Analysis skeleton */}
            <div className="h-80 w-full bg-gray-200 dark:bg-gray-700 rounded-lg mb-6 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Moved all useCallback hooks to the top level of the component to avoid conditional rendering
  
  // Error or entry not found
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
      {/* Header with Back button and Action buttons */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Dashboard
        </button>
        
        {/* Edit/Delete buttons - enabled for all users */}
        <div className="flex space-x-2">
            {isEditMode ? (
              <>
                <button 
                  onClick={() => setIsEditMode(false)}
                  className="flex items-center text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={14} className="mr-1" />
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateSubmit}
                  className="flex items-center text-sm px-3 py-1.5 rounded-md bg-green-500 text-white hover:bg-green-600"
                >
                  <Check size={14} className="mr-1" />
                  Save
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Edit size={14} className="mr-1" />
                  Edit
                </button>
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center text-sm px-3 py-1.5 rounded-md border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete
                </button>
              </>
            )}
          </div>
      </div>
      <div className="bg-card text-foreground rounded-lg shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
        {/* Images - Original and Classified */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Original Image */}
          <div className="w-full h-64 md:h-80 relative">
            <div className="absolute top-0 left-0 bg-black/50 text-white text-xs px-3 py-1 m-2 rounded-full z-10">
              Original Image
            </div>
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
          
          {/* Classified Image */}
          {entry.classified_image && (
            <div className="w-full h-64 md:h-80 relative">
              <div className="absolute top-0 left-0 bg-dalan-yellow/70 text-black text-xs px-3 py-1 m-2 rounded-full z-10">
                AI Classified Image
              </div>
              <img 
                src={entry.classified_image} 
                alt={`${entry.title} - Classified`} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
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
                <span className="ml-2 text-xs bg-dalan-yellow/20 text-dalan-yellow px-2 py-0.5 rounded-full">
                  {entry.user.isCurrentUser ? 'You' : 'Editable'}
                </span>
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
          
          {/* AI Analysis - Simplified */}
          <div className="bg-dalan-yellow/10 p-4 rounded-lg border border-dalan-yellow/30 mb-6">
            <h2 className="text-lg font-medium mb-4">Detection Summary</h2>
            
            {detectionInfo ? (
              <>
                <div className="flex justify-between items-center mb-4 border-b border-dalan-yellow/20 pb-3">
                  <span className="font-medium">Total Cracks Detected:</span>
                  <span className="text-xl font-bold text-dalan-yellow">{detectionInfo.total_cracks}</span>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Primary Type: <span className="font-bold text-dalan-yellow">{entry.type}</span></h3>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium mb-3">Detected Crack Types</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(detectionInfo.crack_types).map(([type, info]) => {
                      // Type assertion to handle TypeScript unknown type
                      const crackInfo = info as CrackTypeInfo;
                      return (
                        <div key={type} className="bg-white/50 dark:bg-gray-800/20 p-3 rounded-md border border-dalan-yellow/20 hover:border-dalan-yellow/40 transition-colors">
                          <p className="font-medium text-dalan-yellow">{type}</p>
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span>Confidence Level:</span>
                            <span>{crackInfo.avg_confidence}%</span>
                          </div>
                          
                          {/* Confidence bar */}
                          <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-dalan-yellow h-full rounded-full" 
                              style={{ width: `${crackInfo.avg_confidence}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/20 rounded-md border border-dalan-yellow/20">
                  <div>
                    <h3 className="text-sm font-medium">Recommended Action</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {entry.severity === 'minor' 
                        ? 'Schedule maintenance within 3 months' 
                        : 'Immediate repair recommended'}
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-dalan-yellow/20 text-xs font-medium text-dalan-yellow">
                    {entry.severity === 'minor' ? 'Minor' : 'Major'} Severity
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-600 dark:text-gray-400">
                Analysis information not available
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => router.push('/map')}
              className="flex items-center justify-center py-2 px-4 bg-dalan-yellow text-black font-medium rounded-md hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              View on Map
            </button>
          </div>
          
          {/* Edit form (only shown in edit mode) */}
          {isEditMode && editFormData && (
            <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
              <h2 className="text-lg font-medium mb-4">Edit Entry</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={editFormData.title}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={editFormData.description}
                    onChange={handleFormChange}
                    rows={4}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </div>
                
                <div>
                  <label htmlFor="severity" className="block text-sm font-medium mb-1">Severity</label>
                  <select
                    id="severity"
                    name="severity"
                    value={editFormData.severity}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div> 
  {/* Delete confirmation modal */}
  {isDeleteModalOpen && (
    <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Entry">
      <div className="p-6">
        <p className="mb-6">Are you sure you want to delete this entry? This action cannot be undone.</p>
        
        <div className="flex justify-end space-x-3">
          <button 
            onClick={() => setIsDeleteModalOpen(false)}
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleDelete}
            className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
      </Modal>
      )}
    </div>
  )
}