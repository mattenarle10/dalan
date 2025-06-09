'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  Hash, 
  Tag, 
  Layers, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Maximize2,
  Shield
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEntry } from '@/lib/swr-hooks'
import { EditFormData } from '@/components/modal/EditModal'
import EditModal from '@/components/modal/EditModal'
import DeleteConfirmationModal from '@/components/modal/DeleteConfirmationModal'
import { ToastProvider, useToast } from '@/components/toast/ToastProvider'
import ImageViewer from '@/components/ImageViewer'

type CrackTypeInfo = { count: number; avg_confidence: number }

// Dynamically import Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false, 
  loading: () => <div className="w-full h-60 bg-gray-100 animate-pulse rounded-lg"></div> 
})

export default function DetailsPage() {
  // Wrap the component with ToastProvider
  return (
    <ToastProvider>
      <DetailsContent />
    </ToastProvider>
  )
}

function DetailsContent() {
  const router = useRouter()
  const params = useParams()
  const { entry: originalEntry, isLoading: isLoadingEntry, updateEntryData, deleteEntryData } = useEntry(params.id as string)
  const { showToast } = useToast()
  
  // Create a modified entry object that always treats the current user as the owner
  const entry = originalEntry ? {
    ...originalEntry,
    user: originalEntry.user ? {
      ...originalEntry.user,
      isCurrentUser: true // Always set isCurrentUser to true
    } : { isCurrentUser: true, name: 'Current User' }
  } : null
  
  // State for modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null)
  
  // State for image viewer
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [currentViewImage, setCurrentViewImage] = useState('')
  const [currentImageAlt, setCurrentImageAlt] = useState('')
  
  // Handle edit form submission
  const handleUpdateSubmit = useCallback(async (formData: EditFormData) => {
    try {
      await updateEntryData(formData)
      setIsEditModalOpen(false)
      showToast('Entry updated successfully', 'success')
    } catch (err) {
      console.error('Failed to update entry:', err)
      showToast('Failed to update entry', 'error')
    }
  }, [updateEntryData, showToast])
  
  // Handle delete
  const handleDelete = useCallback(async () => {
    try {
      await deleteEntryData()
      showToast('Entry deleted successfully', 'success')
      router.push('/dashboard')
    } catch (err) {
      console.error('Failed to delete entry:', err)
      setIsDeleteModalOpen(false)
      showToast('Failed to delete entry', 'error')
    }
  }, [deleteEntryData, router, showToast])
  
  // Initialize edit form data when entry is loaded or edit modal is opened
  useEffect(() => {
    if (originalEntry && isEditModalOpen) {
      setEditFormData({
        title: originalEntry.title,
        description: originalEntry.description,
        severity: originalEntry.severity
      })
    }
  }, [originalEntry, isEditModalOpen])
  
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
  
  // Error or entry not found
  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <AlertTriangle className="mx-auto text-amber-500 mb-4" size={48} />
          <h1 className="text-xl font-bold mb-2">Entry Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The road crack entry you&apos;re looking for doesn&apos;t exist or has been removed.</p>
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
        <div className="flex space-x-3">
          <button
            onClick={() => setIsEditModalOpen(true)}
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
        </div>
      </div>
      
      {/* Main Layout */}
      <div className="space-y-6">
        {/* Top Section - Two Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Image and Details */}
          <div className="lg:col-span-7 space-y-5 flex flex-col">
            {/* Images - Original and Classified */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Original Image */}
              <div className="rounded-lg overflow-hidden border border-input h-64 md:h-[300px] relative group">
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full z-10">
                  Original
                </div>
                <Image 
                  src={entry.image} 
                  alt={`Road crack: ${entry.title}`}
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => {
                    setCurrentViewImage(entry.image)
                    setCurrentImageAlt(`Road crack: ${entry.title}`)
                    setImageViewerOpen(true)
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  aria-label="View full size image"
                >
                  <div className="p-3 rounded-full bg-black/60 text-white">
                    <Maximize2 size={20} />
                  </div>
                </button>
              </div>
              
              {/* Classified Image */}
              {entry.classified_image && (
                <div className="rounded-lg overflow-hidden border border-input h-64 md:h-[300px] relative group">
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full z-10">
                AI Classified
                  </div>
                  <Image 
                    src={entry.classified_image} 
                    alt={`Road crack: ${entry.title} - Classified`}
                    width={800}
                    height={600}
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={() => {
                      setCurrentViewImage(entry.classified_image)
                      setCurrentImageAlt(`Road crack: ${entry.title} - Classified`)
                      setImageViewerOpen(true)
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-200 opacity-0 group-hover:opacity-100"
                    aria-label="View full size classified image"
                  >
                    <div className="p-3 rounded-full bg-black/60 text-white">
                      <Maximize2 size={20} />
                    </div>
                  </button>
                </div>
              )}
            </div>
            
            {/* Description with User Info */}
            <div className="bg-card rounded-lg border border-input overflow-hidden flex-grow">
              <h2 className="text-base font-medium p-3 border-b border-input flex items-center bg-gradient-to-r from-dalan-yellow/5 to-transparent">
                <div className="bg-dalan-yellow/15 p-1.5 rounded-lg mr-2">
                  <FileText size={16} className="text-dalan-yellow" />
                </div>
                <span className="flex-1 font-semibold">Description</span>
                <span className="text-xs bg-dalan-yellow/10 text-dalan-yellow px-2.5 py-1 rounded-full font-medium">
                  {entry.type}
                </span>
              </h2>
              
              <div className="p-5">
                {/* Title first - highlighted with better styling */}
                <h3 className="text-xl font-medium mb-4 text-foreground border-l-4 border-dalan-yellow pl-3 py-1">{entry.title}</h3>
                
                {/* Description content - more visually appealing */}
                <div className="bg-gradient-to-br from-muted/20 to-muted/5 p-4 rounded-lg mb-5 border border-input/50">
                  <p className="text-foreground/90 leading-relaxed">{entry.description}</p>
                </div>
                
                {/* User info - moved below description with improved styling */}
                <div className="flex items-center pt-3 border-t border-input mt-1">
                  <div className="w-10 h-10 rounded-full bg-dalan-yellow/20 flex items-center justify-center mr-3 overflow-hidden border border-dalan-yellow/30">
                    {entry.user.avatar ? (
                      <Image 
                        src={entry.user.avatar} 
                        alt={entry.user.name} 
                        width={40}
                        height={40}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-dalan-yellow font-medium text-sm">
                        {entry.user.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">Reported by {entry.user.name}</p>
                        <span className="text-xs bg-dalan-yellow/10 text-dalan-yellow px-2 py-0.5 rounded-full font-medium">
                          {entry.user.isCurrentUser ? 'You' : 'Editable'}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-foreground/70 bg-muted/30 px-2 py-1 rounded-md">
                        <Calendar size={12} className="mr-1 text-dalan-yellow" />
                        {formattedDate}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Map */}
          <div className="lg:col-span-5 flex flex-col">
            {/* Map */}
            <div className="bg-card rounded-lg border border-input overflow-hidden flex-grow flex flex-col">
              <h2 className="text-base font-medium p-3 border-b border-input flex items-center bg-gradient-to-r from-dalan-yellow/5 to-transparent">
                <div className="bg-dalan-yellow/15 p-1.5 rounded-lg mr-2">
                  <MapPin size={16} className="text-dalan-yellow" />
                </div>
                <span className="flex-1 font-semibold">Location</span>
              </h2>
              
              <div className="px-4 py-3 border-b border-input bg-gradient-to-br from-muted/20 to-muted/5">
                <div className="flex items-center">
                  <MapPin size={16} className="mr-2 text-dalan-yellow" />
                  <span className="text-sm font-medium">{entry.location}</span>
                </div>
              </div>
              
              <div className="flex-grow h-[300px] md:h-[400px]">
                <div className="h-full w-full">
                  <Map 
                    initialCenter={entry.coordinates}
                    zoom={16}
                    markers={[{ position: entry.coordinates, popup: entry.title }]}
                  />
                </div>
              </div>
              <div className="p-3 border-t border-input bg-gradient-to-b from-transparent to-muted/10">
                <button
                  onClick={() => router.push('/map')}
                  className="flex items-center justify-center py-1.5 px-3 w-full bg-dalan-yellow text-black font-medium rounded-md hover:opacity-90 transition-opacity text-sm"
                >
                  View on Map
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Section - Detection Summary (Full Width) */}
        <div className="bg-card rounded-lg border border-input overflow-hidden">
          <div className="bg-gradient-to-r from-dalan-yellow/20 to-transparent p-4 border-b border-input">
            <h2 className="text-lg font-medium flex items-center">
              <AlertTriangle size={18} className="mr-2 text-dalan-yellow" />
              <span>Detection Summary</span>
              <span className="ml-auto text-xs bg-dalan-yellow/30 text-dalan-yellow px-3 py-1 rounded-full">
                AI Analysis Results
              </span>
            </h2>
          </div>
          
          <div className="p-4">
            {detectionInfo ? (
              <div className="space-y-6">
                {/* Summary Overview - Improved cards with better visual hierarchy */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Total Cracks */}
                  <div className="bg-gradient-to-br from-card to-card/80 rounded-xl p-4 border border-input shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-2">
                      <div className="bg-dalan-yellow/15 p-2 rounded-lg mr-3">
                        <Hash size={18} className="text-dalan-yellow" />
                      </div>
                      <p className="text-sm font-medium text-foreground/70">Total Cracks</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground ml-1">
                      {detectionInfo.total_cracks}
                      <span className="text-xs font-normal text-foreground/50 ml-1">detected</span>
                    </p>
                  </div>
                  
                  {/* Primary Type */}
                  <div className="bg-gradient-to-br from-card to-card/80 rounded-xl p-4 border border-input shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-2">
                      <div className="bg-dalan-yellow/15 p-2 rounded-lg mr-3">
                        <Tag size={18} className="text-dalan-yellow" />
                      </div>
                      <p className="text-sm font-medium text-foreground/70">Primary Type</p>
                    </div>
                    <p className="text-xl font-bold text-foreground ml-1 truncate">{entry.type}</p>
                  </div>
                  
                    {/* Severity */}
                    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl p-4 border border-input shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-2">
                        <div className="bg-dalan-yellow/15 p-2 rounded-lg mr-3">
                          <Shield size={18} className="text-dalan-yellow" />
                        </div>
                        <p className="text-sm font-medium text-foreground/70">Severity</p>
                      </div>
                      <div className="flex items-center ml-1">
                        <p className="text-xl font-bold text-foreground">
                          {entry.severity === 'minor' ? 'Minor' : 'Major'}
                        </p>
                        <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${entry.severity === 'minor' ? 'bg-dalan-yellow/10 text-dalan-yellow' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>
                          {entry.severity === 'minor' ? 'Low Risk' : 'High Risk'}
                        </span>
                      </div>
                    </div>
                    
      
                </div>
                
                {/* Crack Types - Redesigned Layout */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-dalan-yellow/15 p-2 rounded-lg mr-3">
                        <Layers size={18} className="text-dalan-yellow" />
                      </div>
                      <h3 className="font-medium text-foreground text-lg">Detected Crack Types</h3>
                    </div>
                   
                  </div>
                  
                  <div className="flex flex-col gap-5 overflow-y-auto">
                    {Object.entries(detectionInfo.crack_types).map(([type, info]) => {
                      // Type assertion to handle TypeScript unknown type
                      const crackInfo = info as CrackTypeInfo;
                      const confidenceLevel = crackInfo.avg_confidence;
                      
                      // Determine confidence level styling
                      let confidenceColor, confidenceTextColor, confidenceBg, confidenceIcon;
                      
                      if (confidenceLevel >= 80) {
                        confidenceColor = 'bg-green-500 dark:bg-green-600';
                        confidenceTextColor = 'text-green-600 dark:text-green-400';
                        confidenceBg = 'bg-green-50 dark:bg-green-900/20';
                        confidenceIcon = <CheckCircle size={16} className={confidenceTextColor} />;
                      } else if (confidenceLevel >= 60) {
                        confidenceColor = 'bg-amber-500 dark:bg-amber-600';
                        confidenceTextColor = 'text-amber-600 dark:text-amber-400';
                        confidenceBg = 'bg-amber-50 dark:bg-amber-900/20';
                        confidenceIcon = <AlertCircle size={16} className={confidenceTextColor} />;
                      } else {
                        confidenceColor = 'bg-red-500 dark:bg-red-600';
                        confidenceTextColor = 'text-red-600 dark:text-red-400';
                        confidenceBg = 'bg-red-50 dark:bg-red-900/20';
                        confidenceIcon = <AlertCircle size={16} className={confidenceTextColor} />;
                      }
                      
                      // Use type for the key in the div below
                      
                      return (
                        <div key={type} className="bg-gradient-to-br from-card to-card/90 rounded-xl border border-input overflow-hidden hover:shadow-md transition-all duration-300 hover:border-dalan-yellow/30 w-full">
                          {/* Header with gradient background based on confidence */}
                          <div className={`p-4 border-b border-input bg-gradient-to-r ${confidenceLevel >= 80 ? 'from-green-50/50 to-transparent dark:from-green-900/10' : confidenceLevel >= 60 ? 'from-amber-50/50 to-transparent dark:from-amber-900/10' : 'from-red-50/50 to-transparent dark:from-red-900/10'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="bg-dalan-yellow/15 p-2 rounded-lg mr-3">
                                  <FileText size={16} className="text-dalan-yellow" />
                                </div>
                                <span className="font-medium text-foreground">{type}</span>
                              </div>
                              <span className="text-sm px-2.5 py-1 rounded-full bg-dalan-yellow/10 text-dalan-yellow font-medium">
                                {crackInfo.count}
                              </span>
                            </div>
                          </div>
                          
                          <div className="p-4">
                            {/* Confidence indicator */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <div className={`p-1.5 rounded-md mr-2 ${confidenceBg}`}>
                                    {confidenceIcon}
                                  </div>
                                  <span className="text-sm font-medium">AI Confidence</span>
                                </div>
                                <span className={`text-sm font-bold ${confidenceTextColor}`}>{confidenceLevel}%</span>
                              </div>
                              
                              <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                                <div 
                                  className={`${confidenceColor} h-full rounded-full transition-all duration-500 ease-out`}
                                  style={{ width: `${confidenceLevel}%` }}
                                ></div>
                              </div>
                            </div>
                            
                           
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-foreground/70">
                Analysis information not available
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Modal */}
      {editFormData && (
        <EditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateSubmit}
          initialData={editFormData}
        />
      )}
      
      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
      
      {/* Image Viewer */}
      <ImageViewer
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={currentViewImage}
        altText={currentImageAlt}
      />
    </div>
  )
}