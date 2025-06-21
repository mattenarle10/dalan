'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { MapPin, Upload, AlertTriangle, Check, Camera, ChevronLeft, ChevronRight, Info, X, Loader, Navigation } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import SuccessModal from '@/components/modal/SuccessModal'
import { createEntry } from '@/lib/api'
import { RoadCrackEntry } from '@/lib/interface'

// Dynamically import Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false, 
  loading: () => <div className="w-full h-60 bg-gray-100 animate-pulse rounded-lg"></div> 
})

// Create a stable MapContainer component that won't remount when coordinates change
const MapContainer = memo(function MapContainer({ 
  coordinates, 
  onCenterChanged 
}: { 
  coordinates: [number, number]; 
  onCenterChanged: (coords: [number, number]) => void;
}) {
  // Create a ref for the map instance
  const mapRef = useRef<{
    mapInstance: mapboxgl.Map | null;
    setCenter: (coordinates: [number, number]) => void;
    getCenter: () => [number, number];
    isInitialized: () => boolean;
    addMarkers: (markers: Array<{ coordinates: [number, number], element?: HTMLElement, popup?: { content: string, offset?: number } }>) => void;
  }>(null);
  
  // Use a ref to track the last update time to prevent update loops
  const lastUpdateTime = useRef<number>(0);
  
  // This function handles map center changes when the user drags the map
  const handleMapCenterChanged = useCallback((coords: [number, number]) => {
    // Get current timestamp
    const now = Date.now();
    
    // Simple debounce - ignore updates that are too close together (50ms)
    if (now - lastUpdateTime.current < 50) return;
    
    // Update the timestamp
    lastUpdateTime.current = now;
    
    // Log the coordinates for debugging
    console.log('[MapContainer] Map center changed:', coords);
    
    // Always update parent component immediately with new coordinates
    onCenterChanged(coords);
  }, [onCenterChanged]);
  
  // This effect handles external coordinate changes (like from search results)
  useEffect(() => {
    // Only proceed if map is initialized
    if (!mapRef.current || !mapRef.current.isInitialized()) return;
    
    console.log('[MapContainer] Coordinates changed externally:', coordinates);
    
    // Always update the map position when coordinates change from parent
    mapRef.current.setCenter(coordinates);
  }, [coordinates]);
  
  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        initialCenter={coordinates}
        centerPin
        onCenterChanged={handleMapCenterChanged}
      />
    </div>
  );
});  // Remove memo comparison function to ensure updates are always processed

// No longer using memo comparison function as it was causing issues with position updates

export default function AddEntryPage() {
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('Manila, Philippines')
  const [coordinates, setCoordinates] = useState<[number, number]>([120.9842, 14.5995]) // Default to Manila
  const [severity, setSeverity] = useState<'minor' | 'major'>('minor')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  // State for location search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ place_name: string; center: [number, number] }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  
  // Ref for map container to scroll to it when needed
  const mapContainer = useRef<HTMLDivElement>(null);
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submittedEntry, setSubmittedEntry] = useState<RoadCrackEntry | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  
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

  // Function to search for locations using Mapbox Geocoding API
  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    setShowSearchResults(true);
    
    try {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=5`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.features || []);
        
        // Don't auto-select the first result - wait for user to explicitly select a result
        // Only show the search results for the user to choose from
      } else {
        console.error('Error searching for location:', response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocation(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Function to select a location from search results
  const handleSelectSearchResult = (result: {place_name: string, center: [number, number]}) => {
    // Update location state with the selected place name
    setLocation(result.place_name);
    
    // Update coordinates with the selected location's coordinates
    setCoordinates(result.center);
    
    // Clear search results and query
    setSearchResults([]);
    setShowSearchResults(false);
    setSearchQuery('');
    
    // Scroll to map if needed
    if (mapContainer.current) {
      mapContainer.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Provide visual feedback that the location has been selected
    const feedbackEl = document.createElement('div');
    feedbackEl.className = 'location-selected-feedback';
    feedbackEl.style.position = 'absolute';
    feedbackEl.style.top = '50%';
    feedbackEl.style.left = '50%';
    feedbackEl.style.transform = 'translate(-50%, -50%)';
    feedbackEl.style.backgroundColor = 'rgba(255, 203, 20, 0.7)';
    feedbackEl.style.borderRadius = '50%';
    feedbackEl.style.width = '60px';
    feedbackEl.style.height = '60px';
    feedbackEl.style.animation = 'pulse 0.5s ease-out';
    if (mapContainer.current) {
      mapContainer.current.appendChild(feedbackEl);
      setTimeout(() => {
        if (mapContainer.current && mapContainer.current.contains(feedbackEl)) {
          mapContainer.current.removeChild(feedbackEl);
        }
      }, 500);
    }
    
    // Update current step to 2 (location selection)
    setCurrentStep(2);
  };

  // Function to get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    setIsGettingCurrentLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude } = position.coords;
        const newCoordinates: [number, number] = [longitude, latitude];
        setCoordinates(newCoordinates);
        
        // Reverse geocode to get location name
        try {
          const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&limit=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              setLocation(data.features[0].place_name);
            } else {
              setLocation(`Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          setLocation(`Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setIsGettingCurrentLocation(false);
        }
      },
      (error) => {
        console.error('Error getting current location:', error);
        alert('Unable to retrieve your location. Please ensure location services are enabled.');
        setIsGettingCurrentLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };  
  
  // Create a ref to store the last drag timestamp (instead of attaching to function)
  const lastDragTimestampRef = useRef(0);

  // Function to handle map center changed (when user drags the map)
  const handleMapCenterChanged = useCallback((coords: [number, number]) => {
    console.log('[AddEntryPage] handleMapCenterChanged called with coords:', coords);
    
    // Update coordinates state - ensure we update this immediately
    console.log('[AddEntryPage] Previous coordinates:', coordinates);
    setCoordinates(coords);
    console.log('[AddEntryPage] Updated coordinates state');
    
    // Show loading state
    console.log('[AddEntryPage] Setting loading states');
    setIsSearching(true);
    setShowSearchResults(false); // Hide search results when map is dragged
    
    // Provide visual feedback that the location is being processed
    const [lng, lat] = coords;
    
    // Immediately set a temporary location name while we fetch the actual name
    const tempLocation = `Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    console.log('[AddEntryPage] Setting temporary location:', tempLocation);
    setLocation(tempLocation);
    
    // Store the last drag timestamp to prevent race conditions
    const dragTimestamp = Date.now();
    const prevTimestamp = lastDragTimestampRef.current || 0;
    console.log('[AddEntryPage] Updating drag timestamp from', prevTimestamp, 'to', dragTimestamp);
    lastDragTimestampRef.current = dragTimestamp;
    
    // Debounce the reverse geocoding to avoid too many API calls while dragging
    console.log('[AddEntryPage] Setting debounce timeout for reverse geocoding');
    const debounceTimeout = setTimeout(() => {
      console.log('[AddEntryPage] Debounce timeout fired, timestamp check:', 
        dragTimestamp === lastDragTimestampRef.current ? 'MATCH' : 'OUTDATED');
      
      // Only proceed if this is still the most recent drag event
      if (dragTimestamp !== lastDragTimestampRef.current) {
        console.log('[AddEntryPage] Skipping outdated reverse geocode request');
        return;
      }
      
      // Reverse geocode to get location name
      console.log('[AddEntryPage] Starting reverse geocoding for:', coords);
      const reverseGeocode = async () => {
        console.log('[AddEntryPage] Inside reverseGeocode function for:', [lng, lat]);
        try {
          const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
          console.log('[AddEntryPage] Fetching from Mapbox Geocoding API');
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&limit=1`
          );
          
          if (response.ok) {
            console.log('[AddEntryPage] Geocoding API response received successfully');
            const data = await response.json();
            console.log('[AddEntryPage] Geocoding data:', data);
            
            if (data.features && data.features.length > 0) {
              // Clear all event listeners
              clearTimeout(debounceTimeout);
              lastDragTimestampRef.current = 0;
              console.log('[AddEntryPage] Clearing state');
              // Get the most relevant place name
              const placeName = data.features[0].place_name;
              console.log('[AddEntryPage] Setting location to:', placeName);
              setLocation(placeName);
              
              // Clear search query to show the selected location clearly
              console.log('[AddEntryPage] Clearing search query');
              setSearchQuery('');
            } else {
              // If no results, just show coordinates
              const fallbackLocation = `Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
              console.log('[AddEntryPage] No features found, using fallback:', fallbackLocation);
              setLocation(fallbackLocation);
            }
          } else {
            console.error('[AddEntryPage] Geocoding API response not OK:', response.status);
            throw new Error('Failed to fetch location data');
          }
        } catch (error) {
          console.error('[AddEntryPage] Error in reverse geocoding:', error);
          // Fallback to showing coordinates
          const fallbackLocation = `Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          console.log('[AddEntryPage] Setting fallback location after error:', fallbackLocation);
          setLocation(fallbackLocation);
        } finally {
          // Hide loading state
          console.log('[AddEntryPage] Finished reverse geocoding, hiding loading state');
          setIsSearching(false);
        }
      };
      
      // Execute the reverse geocoding
      console.log('[AddEntryPage] Executing reverseGeocode function');
      reverseGeocode();
    }, 300); // Wait 300ms after dragging stops before geocoding
  }, [coordinates, setCoordinates, setLocation, setSearchQuery, setShowSearchResults, setIsSearching]);

  // lastDragTimestampRef is already used instead of static property

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    if (!selectedFile) {
      alert('Please select an image');
      return;
    }
    
    setIsSubmitting(true);
    setShowSuccessModal(true); // Show modal immediately in loading state
    
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('location', location);
      formData.append('coordinates', JSON.stringify(coordinates));
      formData.append('severity', severity);
      formData.append('image', selectedFile);
      // Add user_id - using a default value if not available
      formData.append('user_id', '1'); // Use appropriate user ID from your auth system
      
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
      setPreviewUrl(null);
      setCurrentStep(1);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit the form. Please try again.');
      setShowSuccessModal(false); // Hide modal on error
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="space-y-4 animate-fadeIn" ref={mapContainer}>
            {/* Search box - now above the map */}
            <div className="mb-4">
              <label htmlFor="search-location" className="block text-sm font-medium mb-2 text-foreground">Search Location</label>
              <div className="relative w-full">
                <div className="relative w-full bg-background text-foreground rounded-md border border-border shadow-sm focus-within:ring-1 focus-within:ring-foreground focus-within:border-foreground transition-all">
                  <div className="flex items-center p-3">
                    <MapPin className="text-foreground" size={18} />
                    <input
                      id="search-location"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowSearchResults(true)}
                      className="w-full px-3 py-1 bg-background border-none focus:ring-0 focus:outline-none text-foreground placeholder:text-muted-foreground"
                      placeholder="Search for a location..."
                      aria-expanded={showSearchResults}
                      aria-autocomplete="list"
                      aria-controls="search-results"
                      role="combobox"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setShowSearchResults(false);
                        }}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Clear search"
                      >
                        <X size={16} className="text-foreground" />
                      </button>
                    )}
                    {isSearching && (
                      <Loader className="mr-2 animate-spin text-foreground" size={16} />
                    )}
                  </div>
                </div>
                
                {/* Search results dropdown - modal-like overlay with proper theme */}
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
            </div>
            
            {/* Map - now below search box */}
            <div className="h-80 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 shadow-sm">
              <MapContainer 
                coordinates={coordinates}
                onCenterChanged={handleMapCenterChanged}
              />
            </div>
            
            {/* Selected location display - improved styling with theme consistency */}
            <div className="mt-4 p-4 border border-border rounded-md bg-background shadow-sm">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex-grow">
                  <p className="text-sm font-medium mb-2 text-foreground">Pin Location</p>
                  <div className="flex items-start">
                    <MapPin size={18} className="mr-2 text-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {location || 'No location selected'}
                      </p>
                      {coordinates && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Coordinates: {coordinates[1].toFixed(5)}, {coordinates[0].toFixed(5)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button 
                    type="button" 
                    onClick={getCurrentLocation}
                    disabled={isGettingCurrentLocation}
                    className="flex items-center justify-center w-full md:w-auto px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {isGettingCurrentLocation ? (
                      <>
                        <Loader size={16} className="mr-2 animate-spin" />
                        Getting location...
                      </>
                    ) : (
                      <>
                        <Navigation size={16} className="mr-2" />
                        Use my current location
                      </>
                    )}
                  </button>
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
