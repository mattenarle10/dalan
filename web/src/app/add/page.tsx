'use client'

import { useState, useEffect, useRef, useCallback, memo, useMemo, forwardRef, useImperativeHandle } from 'react'
import { MapPin, Upload, AlertTriangle, Check, Camera, ChevronLeft, ChevronRight, Info, X, Loader, Navigation } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import SuccessModal from '@/components/modal/SuccessModal'
import { createEntry } from '@/lib/api'
import { RoadCrackEntry } from '@/lib/interface'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthContext } from '@/contexts/AuthContext'

// Dynamically import Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false, 
  loading: () => <div className="w-full h-60 bg-gray-100 animate-pulse rounded-lg"></div>
})

// Create a stable MapContainer component that won't remount when coordinates change
const MapContainer = memo(forwardRef<
  {
    centerMap: (coords: [number, number]) => void;
  },
  { 
    coordinates: [number, number]; 
    onCenterChanged: (coords: [number, number]) => void;
  }
>(function MapContainer({ 
  coordinates, 
  onCenterChanged
}, controlRef) {
  // Create a ref for the map instance
  const mapRef = useRef<{
    mapInstance: mapboxgl.Map | null;
    setCenter: (coordinates: [number, number], updateCamera?: boolean) => void;
    getCenter: () => [number, number];
    isInitialized: () => boolean;
    addMarkers: (markers: Array<{ coordinates: [number, number], element?: HTMLElement, popup?: { content: string, offset?: number } }>) => void;
  }>(null);
  
  // Expose the centerMap function through the ref
  useImperativeHandle(controlRef, () => ({
    centerMap: (coords: [number, number]) => {
      if (mapRef.current && mapRef.current.isInitialized()) {
        mapRef.current.setCenter(coords, true);
      }
    }
  }), []);
  
  // Use a ref to track the last update time to prevent update loops
  const lastUpdateTime = useRef<number>(0);
  const lastCoordinates = useRef<[number, number]>(coordinates);
  const isDragging = useRef<boolean>(false);
  
  // This function handles map center changes when the user drags the map
  const handleMapCenterChanged = useCallback((coords: [number, number]) => {
    // Only update if dragging (user initiated) or if it's an external update
    if (!isDragging.current && 
        lastCoordinates.current[0] === coords[0] && 
        lastCoordinates.current[1] === coords[1]) {
      return;
    }
    
    // Get current timestamp
    const now = Date.now();
    
    // Skip updates that are too close together (rate limiting)
    if (now - lastUpdateTime.current < 30) return;
    
    // Update the timestamp and last coordinates
    lastUpdateTime.current = now;
    lastCoordinates.current = [...coords];
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[MapContainer] Map center changed:', coords);
    }
    
    // Update parent component with the new coordinates - force a new array to trigger React updates
    onCenterChanged([...coords]);
  }, [onCenterChanged]);
  
  // Setup drag tracking
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isInitialized() || !mapRef.current.mapInstance) return;
    
    const map = mapRef.current.mapInstance;
    
    // Track when map is being dragged
    const onDragStart = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[MapContainer] Drag started');
      }
      isDragging.current = true;
    };
    
    const onDrag = () => {
      if (!isDragging.current) return;
      
      // Get current position during drag
      const center = map.getCenter();
      const currentCoords: [number, number] = [center.lng, center.lat];
      
      // Update last coordinates and notify parent immediately
      lastCoordinates.current = [...currentCoords];
      
      // Notify parent immediately about position change during drag
      onCenterChanged([...currentCoords]);
    };
    
    const onDragEnd = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[MapContainer] Drag ended');
      }
      isDragging.current = false;
      
      // Get final position
      const center = map.getCenter();
      const finalCoords: [number, number] = [center.lng, center.lat];
      
      // Update last coordinates
      lastCoordinates.current = [...finalCoords];
      
      // Notify parent
      onCenterChanged([...finalCoords]);
    };
    
    // Add event listeners
    map.on('dragstart', onDragStart);
    map.on('drag', onDrag);
    map.on('dragend', onDragEnd);
    
    return () => {
      // Clean up event listeners
      if (map) {
        map.off('dragstart', onDragStart);
        map.off('drag', onDrag);
        map.off('dragend', onDragEnd);
      }
    };
  }, [onCenterChanged]);
  
  // This effect handles external coordinate changes (like from search results)
  useEffect(() => {
    // Update the reference to avoid drifting
    if (coordinates[0] !== lastCoordinates.current[0] || coordinates[1] !== lastCoordinates.current[1]) {
      lastCoordinates.current = coordinates;
      
      // Skip if map is not initialized
      if (!mapRef.current || !mapRef.current.isInitialized()) return;
      
      // Skip if currently dragging (user triggered)
      if (isDragging.current) return;
      
      // For external updates (search results), move the camera
      mapRef.current.setCenter(coordinates, true);
    }
  }, [coordinates]);
  
  // Important: Use useMemo to prevent recreating this node
  const mapElement = useMemo(() => (
    <Map
      ref={mapRef}
      initialCenter={lastCoordinates.current}
      centerPin
      interactive={true}
      onCenterChanged={handleMapCenterChanged}
    />
  ), [handleMapCenterChanged]);
  
  return (
    <div className="w-full h-full relative">
      {mapElement}
    </div>
  );
}), (prevProps, nextProps) => {
  // Smart memo: only prevent re-render if coordinates haven't changed significantly
  const coordsChanged = 
    Math.abs(prevProps.coordinates[0] - nextProps.coordinates[0]) > 0.000001 ||
    Math.abs(prevProps.coordinates[1] - nextProps.coordinates[1]) > 0.000001;
  
  // Allow re-render if coordinates changed significantly, prevent otherwise
  return !coordsChanged;
});

export default function AddEntryPage() {
  return (
    <ProtectedRoute>
      <AddEntryContent />
    </ProtectedRoute>
  )
}

function AddEntryContent() {
  const { user } = useAuthContext()
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [coordinates, setCoordinates] = useState<[number, number]>([120.9842, 14.5995]) // Manila as fallback instead of [0,0]
  
  // Add a stable ref for coordinates to prevent unnecessary re-renders
  const coordsRef = useRef<[number, number]>(coordinates);
  
  // Add a ref to directly access the map for programmatic control
  const mapControlRef = useRef<{
    centerMap: (coords: [number, number]) => void;
  }>({
    centerMap: () => {} // fallback function
  });
  
  // Step state
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [severity, setSeverity] = useState<'minor' | 'major'>('minor')
  
  // Upload state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submittedEntry, setSubmittedEntry] = useState<RoadCrackEntry | null>(null)
  
  // Location search state  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{place_name: string, center: [number, number]}>>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false)
  const [showLocationFeedback, setShowLocationFeedback] = useState(false)
  
  const mapContainer = useRef<HTMLDivElement | null>(null)
  
  // Handle map center changes - useCallback to prevent unnecessary re-renders
  const handleMapCenterChanged = useCallback(
    (coords: [number, number]) => {
      // Skip update if coordinates haven't changed significantly 
      if (Math.abs(coordsRef.current[0] - coords[0]) < 0.000001 && 
          Math.abs(coordsRef.current[1] - coords[1]) < 0.000001) {
        return;
      }
      
      // Update the ref first for future comparisons
      coordsRef.current = coords;
      
      // Update the component state to trigger re-render
      setCoordinates([...coords]);
      
      // Clear any location query when user moves the map
      setSearchQuery('');
      setShowSearchResults(false);
      
      // Show brief visual feedback for position change
      setShowLocationFeedback(true);
      
      // Start reverse geocoding to get address
      const reverseGeocode = async () => {
        try {
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=address,poi&limit=1`;
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const address = data.features[0].place_name;
            setLocation(address);
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Fallback: use coordinates as location string
          setLocation(`${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`);
        }
      };
      
      // Debounce the reverse geocoding API call
      const timeoutId = setTimeout(() => {
        reverseGeocode();
        setShowLocationFeedback(false);
      }, 500);
      
      // Clean up previous timeout
      return () => clearTimeout(timeoutId);
    },
    []
  );

  // Set initial location on component mount
  useEffect(() => {
    if (location === '') {
      // Initial reverse geocoding
      handleMapCenterChanged(coordinates);
    }
  }, [coordinates, handleMapCenterChanged, location]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=PH&types=place,locality,neighborhood,address,poi&limit=5`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.features) {
        const results = data.features.map((feature: { place_name: string; center: [number, number] }) => ({
          place_name: feature.place_name,
          center: feature.center
        }))
        setSearchResults(results)
        setShowSearchResults(results.length > 0)
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
      setShowSearchResults(false)
    } finally {
      setIsSearching(false)
    }
  }

  // Debounce search function
  useEffect(() => {
    const timeoutId = setTimeout(() => searchLocation(searchQuery), 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleSelectSearchResult = (result: {place_name: string, center: [number, number]}) => {
    const newCoords: [number, number] = [result.center[0], result.center[1]]
    
    // Update coordinates
    setCoordinates(newCoords)
    
    // Update refs to prevent conflicts
    coordsRef.current = newCoords
    
    // Set location to the selected place name
    setLocation(result.place_name)
    
    // Clear search
    setSearchQuery('')
    setShowSearchResults(false)
    
    // Programmatically center the map
    if (mapControlRef.current) {
      mapControlRef.current.centerMap(newCoords)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }

    setIsGettingCurrentLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords: [number, number] = [position.coords.longitude, position.coords.latitude]
        
        // Update coordinates
        setCoordinates(newCoords)
        
        // Update refs
        coordsRef.current = newCoords
        
        // Programmatically center the map
        if (mapControlRef.current) {
          mapControlRef.current.centerMap(newCoords)
        }
        
        // The reverse geocoding will happen in handleMapCenterChanged
        
        setIsGettingCurrentLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Unable to get your current location. Please search for a location instead.')
        setIsGettingCurrentLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      }
    )
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('You must be logged in to submit an entry')
      return
    }
    
    if (!selectedFile) {
      alert('Please select an image')
      return
    }
    
    setIsSubmitting(true)
    setUploadProgress(0)
    setShowSuccessModal(true)
    
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('location', location)
      formData.append('coordinates', JSON.stringify(coordinates));
      formData.append('severity', severity);
      formData.append('image', selectedFile);
      // Use authenticated user ID instead of hardcoded value
      formData.append('user_id', user.id);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          // Increase progress by random amount between 5-15%
          // but cap at 90% until we get the actual response
          const increment = Math.random() * 10 + 5;
          const newProgress = Math.min(prev + increment, 90);
          return newProgress;
        });
      }, 800);
      
      // Send to API using the api.ts function
      const data = await createEntry(formData);
      
      // Clear interval and set to 100%
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Short delay to show 100% complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set success state
      setIsSuccess(true);
      setSubmittedEntry(data);
      
      // Reset form after successful submission
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setPreviewUrl('');
      setCurrentStep(1);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit the form. Please try again.');
      setShowSuccessModal(false); // Hide modal on error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create a stable instance of MapContainer that won't be recreated on rerenders
  const stableMapContainer = useMemo(() => {
    return (
      <MapContainer 
        coordinates={coordinates}
        onCenterChanged={handleMapCenterChanged}
        ref={mapControlRef}
      />
    );
  }, [handleMapCenterChanged, coordinates]);

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto p-4 pt-20 pb-24 md:pt-24 md:pb-8">
      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal 
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          entry={submittedEntry}
          isLoading={isSubmitting}
          progress={uploadProgress}
        />
      )}
      <h1 className="text-2xl font-bold text-foreground mb-2">Report a Road Crack</h1>
      <p className="text-sm text-foreground/70 mb-6">Follow the steps below to report a road crack in your area</p>
      
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 relative">
        {/* Progress line - positioned behind the circles */}
        <div className="absolute left-0 right-0 h-0.5 bg-border dark:bg-border top-1/2 transform -translate-y-1/2"></div>
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex flex-col items-center relative z-20">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                currentStep === step 
                  ? 'bg-dalan-yellow border-foreground text-foreground font-bold' 
                  : currentStep > step 
                    ? 'bg-green-500 border-green-600 text-white shadow-sm' 
                    : 'bg-background border-border text-foreground'
              }`}
            >
              {currentStep > step ? <Check size={16} /> : step}
            </div>
            <span className={`text-xs mt-2 text-center font-medium transition-colors ${
              currentStep >= step ? 'text-foreground' : 'text-muted-foreground'
            }`}>
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
                    <Image width={500} height={300} unoptimized 
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
                className="flex items-center justify-center h-10 px-5 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={16} className="ml-1.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Pin Location */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fadeIn" ref={mapContainer}>
            {/* Search box with integrated location button */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a location..."
                    className="w-full px-4 py-2 pr-20 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoComplete="off"
                    aria-label="Search for a location"
                    aria-describedby="search-results"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader size={16} className="animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingCurrentLocation}
                    className="flex items-center justify-center w-10 h-10 border border-border rounded-lg bg-background hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Use my current location"
                    aria-label="Use my current location"
                  >
                    {isGettingCurrentLocation ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Navigation size={16} />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Search results dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div 
                  id="search-results"
                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-11/12 max-w-md bg-background text-foreground shadow-lg rounded-lg border border-border z-50 overflow-hidden"
                  style={{ backgroundColor: 'var(--background)' }}
                  role="listbox"
                >
                  <div className="max-h-60 overflow-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-muted focus:bg-muted focus:outline-none transition-colors flex items-start border-b border-border last:border-b-0"
                        onClick={() => handleSelectSearchResult(result)}
                        role="option"
                        aria-selected={false}
                      >
                        <MapPin className="mr-3 flex-shrink-0 text-foreground mt-1" size={16} />
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{result.place_name.split(',')[0]}</span>
                          <span className="text-xs text-muted-foreground mt-0.5">{result.place_name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Map */}
            <div className="h-80 rounded-lg overflow-hidden border border-border shadow-sm relative">
              {stableMapContainer}
              {showLocationFeedback && (
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-dalan-yellow/70 rounded-full w-[60px] h-[60px] animate-pulse"
                  style={{ animation: 'pulse 0.5s ease-out' }}
                />
              )}
            </div>
            
            {/* Compact location display */}
            <div className="p-3 border border-border rounded-md bg-card/50">
              <div className="flex items-center">
                <MapPin size={16} className="mr-2 text-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {location || 'No location selected'}
                  </p>
                  <div className={`text-xs font-mono mt-0.5 text-muted-foreground transition-all duration-75`}>
                    {coordinates[1].toFixed(6)}, {coordinates[0].toFixed(6)}
                  </div>
                </div>
              </div>
              
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="hidden"
                required
              />
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={goToPreviousStep}
                className="flex items-center justify-center h-10 px-5 border border-border text-foreground font-medium rounded-md hover:bg-muted transition-colors"
              >
                <ChevronLeft size={16} className="mr-1.5" />
                Back
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                className="flex items-center justify-center h-10 px-5 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 transition-opacity"
                disabled={!coordinates || !location}
              >
                Next
                <ChevronRight size={16} className="ml-1.5" />
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
                className="flex items-center justify-center h-10 px-5 border border-border text-foreground font-medium rounded-md hover:bg-muted transition-colors"
              >
                <ChevronLeft size={16} className="mr-1.5" />
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center h-10 px-5 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : isSuccess ? (
                  <>
                    <Check size={16} className="mr-1.5" />
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