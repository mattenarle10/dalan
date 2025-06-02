'use client'

import { useState, useRef } from 'react'
import { MapPin, Upload, AlertTriangle, Check } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useData } from '@/context/DataContext'

// Dynamically import Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false, 
  loading: () => <div className="w-full h-60 bg-gray-100 animate-pulse rounded-lg"></div> 
})

export default function AddEntryPage() {
  const router = useRouter()
  const { addEntry, getCurrentUser } = useData()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('Manila, Philippines')
  const [coordinates, setCoordinates] = useState<[number, number]>([120.9842, 14.5995]) // Default to Manila
  const [severity, setSeverity] = useState<'minor' | 'major'>('minor')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

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

  // Handle location selection (could be enhanced with map click in future)
  const handleLocationSelect = () => {
    // Simulate selecting a random location near the initial center
    const lat = coordinates[1] + (Math.random() * 0.02 - 0.01)
    const lng = coordinates[0] + (Math.random() * 0.02 - 0.01)
    const newCoordinates: [number, number] = [lng, lat]
    
    setCoordinates(newCoordinates)
    setLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Add the new entry to our centralized data store
    // The AI would determine the crack type in a real app
    setTimeout(() => {
      const currentUser = getCurrentUser();
      addEntry({
        title,
        description,
        location,
        coordinates,
        severity,
        image: previewUrl || '/cracks/default.jpg',
        user: {
          id: currentUser.id,
          name: currentUser.name,
          isCurrentUser: true
        }
      })
      
      setIsSubmitting(false)
      setIsSuccess(true)
      
      // Reset form and redirect after success
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    }, 1000)
  }

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto p-4 pt-20 pb-24 md:pt-24 md:pb-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Report a Road Crack</h1>
      <p className="text-sm text-foreground/70 mb-6">Fill in the details below to report a road crack in your area</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Map for location selection */}
        <div className="h-80 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 mb-4">
          <Map 
            initialCenter={coordinates}
            zoom={15}
            markers={[{ position: coordinates }]}
          />
        </div>
        
        {/* Image Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Upload Road Crack Image</label>
          <div 
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {previewUrl ? (
              <div className="relative w-full h-48">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG, WEBP up to 5MB</p>
              </div>
            )}
            <input 
              id="file-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
              required
            />
          </div>
        </div>
        
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
        
        {/* Location */}
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
            <AlertTriangle size={12} className="mr-1" />
            AI will automatically determine the crack type from your image
          </p>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-dalan-yellow text-black font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
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
      </form>
    </div>
  )
}
