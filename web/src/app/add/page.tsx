'use client'

import { useState, useRef } from 'react'
import { MapPin, Upload, AlertTriangle, Check, Camera, ChevronLeft, ChevronRight, Info, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useData, RoadCrackEntry } from '@/context/DataContext'
import SuccessModal from '@/components/SuccessModal'

// Dynamically import Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false, 
  loading: () => <div className="w-full h-60 bg-gray-100 animate-pulse rounded-lg"></div> 
})

export default function AddEntryPage() {
  const router = useRouter()
  const { addEntry, getCurrentUser, entries } = useData()
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('Manila, Philippines')
  const [coordinates, setCoordinates] = useState<[number, number]>([120.9842, 14.5995]) // Default to Manila
  const [severity, setSeverity] = useState<'minor' | 'major'>('minor')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submittedEntry, setSubmittedEntry] = useState<RoadCrackEntry | null>(null)
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      
      // Create a preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Function to handle location selection (demo)
  const handleLocationSelect = () => {
    // Generate random coordinates near Manila for demo purposes
    const manilaCenterLng = 120.9842;
    const manilaCenterLat = 14.5995;
    
    // Random offset within ~1km
    const lngOffset = (Math.random() - 0.5) * 0.02;
    const latOffset = (Math.random() - 0.5) * 0.02;
    
    const newCoordinates: [number, number] = [
      manilaCenterLng + lngOffset,
      manilaCenterLat + latOffset
    ];
    
    setCoordinates(newCoordinates);
    setLocation(`Sample Location #${Math.floor(Math.random() * 100)}`);
  };
  
  // Function to handle map click
  const handleMapClick = (newCoordinates: [number, number]) => {
    setCoordinates(newCoordinates);
    // Update location text with coordinates (can be replaced with reverse geocoding in a real app)
    setLocation(`Selected Location (${newCoordinates[1].toFixed(4)}, ${newCoordinates[0].toFixed(4)})`);
  };

  // Navigate between steps
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Add the new entry to our centralized data store
    // The AI would determine the crack type in a real app
    setTimeout(() => {
      const currentUser = getCurrentUser();
      
      // Create a new entry with mock crack type
      const newEntryData: Omit<RoadCrackEntry, 'id' | 'date' | 'type'> = {
        title,
        description,
        location,
        coordinates,
        severity,
        image: previewUrl || '/placeholders/ex1.png',
        user: {
          id: currentUser.id,
          name: currentUser.name,
          isCurrentUser: true
        }
      };
      
      // Add entry to context - this will generate the ID and add the entry
      addEntry(newEntryData);
      
      // We need to find the newly added entry to get its ID
      setTimeout(() => {
        // Get the latest entries
        const latestEntry = entries[0];
        
        // Update state
        setIsSubmitting(false);
        setIsSuccess(true);
        setSubmittedEntry(latestEntry);
        setShowSuccessModal(true);
      }, 100); // Small delay to ensure entry is added
    }, 1000)
  }

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto p-4 pt-20 pb-24 md:pt-24 md:pb-8">
      {/* Success Modal */}
      {submittedEntry && (
        <SuccessModal 
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          entry={submittedEntry}
        />
      )}
      <h1 className="text-2xl font-bold text-foreground mb-2">Report a Road Crack</h1>
      <p className="text-sm text-foreground/70 mb-6">Follow the steps below to report a road crack in your area</p>
      
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 right-0 h-0.5 bg-gray-200" style={{ top: 'calc(50% - 12px)' }}></div>
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex flex-col items-center z-10">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === step 
                ? 'bg-dalan-yellow border-black text-black font-bold' 
                : currentStep > step 
                  ? 'bg-green-500 border-green-600 text-white' 
                  : 'bg-white border-gray-300 text-black'}`}
            >
              {currentStep > step ? <Check size={16} /> : step}
            </div>
            <span className="text-xs mt-1 text-center font-medium">
              {step === 1 ? 'Photo' : step === 2 ? 'Location' : 'Details'}
            </span>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Upload or Take Photo */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Info size={20} className="text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-800 mb-1">How to take a good photo</h3>
                  <p className="text-sm text-blue-700">
                    Please take a clear, well-lit photo directly above the crack. Make sure the entire crack is visible and in focus.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Upload Road Crack Image</label>
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {previewUrl ? (
                  <div className="relative h-48 w-full">
                    <img 
                      src={previewUrl} 
                      alt="Road crack preview" 
                      className="h-full w-full object-contain"
                    />
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewUrl('');
                        setSelectedFile(null);
                      }}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1 transition-colors"
                      aria-label="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload or drag and drop</p>
                    <div className="flex items-center mt-2 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                      <p className="text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Accepted files:</span> PNG, JPG, JPEG, WEBP (max. 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                required
              />
            </div>

            <div className="flex justify-center">
              <button 
                type="button"
                className="flex items-center justify-center py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition-colors"
                onClick={() => document.getElementById('camera-upload')?.click()}
              >
                <Camera size={18} className="mr-2" />
                Take Photo
              </button>
              <input
                id="camera-upload"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="button"
                onClick={goToNextStep}
                disabled={!previewUrl}
                className="flex items-center justify-center py-2 px-6 bg-dalan-yellow text-black font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={18} className="ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Pin Location */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="h-80 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 mb-4">
              <Map 
                initialCenter={coordinates}
                zoom={15}
                markers={[{ position: coordinates }]}
                onMapClick={handleMapClick}
                interactive={true}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="location" className="block text-sm font-medium">Location</label>
              <div className="relative">
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2 pl-10 rounded-md border border-gray-200 dark:border-gray-800 bg-background"
                  placeholder="E.g., Main St, Manila"
                  required
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
              <div className="flex justify-end mt-1">
                <button 
                  type="button" 
                  onClick={handleLocationSelect}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  Get random location (demo)
                </button>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={goToPreviousStep}
                className="flex items-center justify-center py-2 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition-colors"
              >
                <ChevronLeft size={18} className="mr-1" />
                Back
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                className="flex items-center justify-center py-2 px-6 bg-dalan-yellow text-black font-medium rounded-md hover:opacity-90 transition-opacity"
              >
                Next
                <ChevronRight size={18} className="ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Add Details */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium">Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 rounded-md border border-gray-200 dark:border-gray-800 bg-background"
                placeholder="E.g., Deep crack on Main Street"
                required
              />
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 rounded-md border border-gray-200 dark:border-gray-800 bg-background min-h-[100px]"
                placeholder="Describe the crack and any additional details..."
                required
              />
            </div>
            
            {/* Severity */}
            <div className="space-y-2">
              <label htmlFor="severity" className="block text-sm font-medium">Severity</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="severity"
                    value="minor"
                    checked={severity === 'minor'}
                    onChange={() => setSeverity('minor')}
                    className="mr-2"
                  />
                  <span className="text-sm">Minor</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="severity"
                    value="major"
                    checked={severity === 'major'}
                    onChange={() => setSeverity('major')}
                    className="mr-2"
                  />
                  <span className="text-sm">Major</span>
                </label>
              </div>
              <div className="inline-flex items-center mt-2 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                <AlertTriangle size={10} className="text-amber-500 mr-1" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  AI will determine crack type from your image
                </p>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={goToPreviousStep}
                className="flex items-center justify-center py-2 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition-colors"
              >
                <ChevronLeft size={18} className="mr-1" />
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center py-2 px-6 bg-dalan-yellow text-black font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : isSuccess ? (
                  <>
                    <Check size={18} className="mr-2" />
                    Submitted!
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
