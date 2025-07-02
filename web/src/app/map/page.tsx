'use client'
import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Filter, X, MapPin, Calendar, AlertTriangle, ChevronRight, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEntries } from "@/lib/swr-hooks";

// Define the entry type
interface RoadCrackEntry {
  id: string
  title: string
  description: string
  location: string
  coordinates: [number, number] // [longitude, latitude]
  date: string
  severity: 'minor' | 'major'
  type: string
  image: string
  classified_image?: string
  user: {
    id: string
    name: string
    isCurrentUser: boolean
    avatar?: string
  }
  detection_info?: {
    total_cracks: number
    crack_types: {
      [key: string]: {
        count: number
        avg_confidence: number
      }
    }
  }
}

// Dynamically import Map component to avoid SSR issues
const Map = dynamic(
  () => import("@/components/Map"),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div> }
);

// Type for geocoding search results
interface GeocodingResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

// Client component that uses useSearchParams
function MapContent() {
  const { entries } = useEntries();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<RoadCrackEntry | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    types: [] as string[],
    severities: [] as string[]
  });
  
  // Store processed entries to handle loading state
  const [processedEntries, setProcessedEntries] = useState<RoadCrackEntry[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([122.5726, 10.7202]); // Iloilo City coordinates
  const [mapZoom, setMapZoom] = useState(13);
  const searchRef = useRef<HTMLDivElement>(null);

  // Process entries when they're loaded
  useEffect(() => {
    if (entries && Array.isArray(entries)) {
      setProcessedEntries(entries as RoadCrackEntry[]);
    }
  }, [entries]);
  
  // Check URL params for entry ID, lat, lng on mount
  useEffect(() => {
    const entryId = searchParams.get('id');
    if (entryId && processedEntries.length > 0) {
      const entry = processedEntries.find(e => e.id === entryId);
      if (entry) {
        setSelectedEntry(entry);
        setMapCenter(entry.coordinates);
        setMapZoom(14);
      }
    }
  }, [searchParams, processedEntries]);
  
  // Handle clicks outside search results to close them
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Search for locations using Mapbox Geocoding API
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowSearchResults(true);
    
    try {
      const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json`;
      const params = new URLSearchParams({
        access_token: accessToken || '',
        limit: '5',
        country: 'ph', // Limit to Philippines
        types: 'place,address,poi',
      });
      
      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();
      
      if (data.features) {
        setSearchResults(data.features.map((feature: { id: string; place_name: string; center: [number, number] }) => ({
          id: feature.id,
          place_name: feature.place_name,
          center: feature.center
        })));
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle search input changes with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce search requests
    const timer = setTimeout(() => {
      if (value.trim().length >= 3) {
        searchLocation();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  };
  
  // Handle search result selection
  const handleResultSelect = (result: GeocodingResult) => {
    setMapCenter(result.center);
    setMapZoom(14);
    setSearchQuery(result.place_name);
    setShowSearchResults(false);
  };

  // Toggle filter modal
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Handle filter changes for both types and severities
  const handleFilterChange = (category: 'types' | 'severities', value: string) => {
    setActiveFilters(prev => {
      const currentValues = prev[category];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [category]: newValues
      };
    });
  };

  // Handle marker click to show entry details
  const handleMarkerClick = (entryId: string) => {
    const entry = processedEntries.find(e => e.id === entryId);
    if (entry) {
      setSelectedEntry(entry);
    }
  };

  // Close detail card
  const closeDetailCard = () => {
    setSelectedEntry(null);
  };

  // Filter entries based on active filters
  const filteredEntries = processedEntries.filter((entry: RoadCrackEntry) => {
    // If no filters are active, show all entries
    if (activeFilters.types.length === 0 && activeFilters.severities.length === 0) {
      return true;
    }
    
    // Check if entry matches type filter
    const typeMatch = activeFilters.types.length === 0 || 
      activeFilters.types.includes(entry.type);
    
    // Check if entry matches severity filter
    const severityMatch = activeFilters.severities.length === 0 || 
      activeFilters.severities.includes(entry.severity);
    
    // Return true if entry matches both filters
    return typeMatch && severityMatch;
  });
  
  // Convert entries to marker format for the Map component
  const mapMarkers = filteredEntries.map(entry => ({
    position: entry.coordinates,
    popup: entry.title,
    id: entry.id,
    severity: entry.severity
  }));

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto p-4 pt-20 pb-24 md:pt-24 md:pb-8 h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
        <h1 className="text-2xl font-bold">Interactive Map</h1>
        
        {/* Search Bar */}
        <div ref={searchRef} className="relative w-full md:w-80">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.length >= 3 && setShowSearchResults(true)}
              className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-800 !bg-background text-foreground"
              style={{ backgroundColor: 'var(--background)' }}
            />
            <div className="absolute right-3 top-2.5">
              {isSearching ? (
                <Loader2 size={18} className="animate-spin text-gray-400" />
              ) : (
                <Search size={18} className="text-gray-400" />
              )}
            </div>
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md shadow-lg !bg-background border border-gray-200 dark:border-gray-800 overflow-hidden"
                 style={{ backgroundColor: 'var(--background)' }}>
              <ul className="py-1">
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <button
                      onClick={() => handleResultSelect(result)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-start gap-2"
                    >
                      <MapPin size={16} className="mt-0.5 flex-shrink-0 text-gray-500" />
                      <span className="text-sm line-clamp-2">{result.place_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Map Container */}
      <div className="relative flex-grow w-full bg-card rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="h-full">
          <Map
            initialCenter={mapCenter}
            zoom={mapZoom}
            markers={mapMarkers}
            onMarkerClick={handleMarkerClick}
          />
        </div>

        {/* Filter Button */}
        <button
          onClick={toggleFilter}
          className="absolute top-4 right-4 z-10 !bg-background text-foreground p-3 rounded-full shadow-md border border-gray-200 dark:border-gray-800"
          style={{ backgroundColor: 'var(--background)' }}
          aria-label="Filter"
        >
          <Filter size={20} />
        </button>

        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="absolute top-16 right-4 z-10 !bg-background text-foreground p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 w-64"
               style={{ backgroundColor: 'var(--background)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Filter Cracks</h3>
              <button onClick={toggleFilter} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <X size={16} />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Crack Type</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={activeFilters.types.includes('alligator')}
                    onChange={() => handleFilterChange('types', 'alligator')}
                    className="mr-2"
                  />
                  <span className="text-sm">Alligator</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={activeFilters.types.includes('longitudinal')}
                    onChange={() => handleFilterChange('types', 'longitudinal')}
                    className="mr-2"
                  />
                  <span className="text-sm">Longitudinal</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={activeFilters.types.includes('transverse')}
                    onChange={() => handleFilterChange('types', 'transverse')}
                    className="mr-2"
                  />
                  <span className="text-sm">Transverse</span>
                </label>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Severity</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={activeFilters.severities.includes('minor')}
                    onChange={() => handleFilterChange('severities', 'minor')}
                    className="mr-2"
                  />
                  <span className="text-sm">Minor</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={activeFilters.severities.includes('major')}
                    onChange={() => handleFilterChange('severities', 'major')}
                    className="mr-2"
                  />
                  <span className="text-sm">Major</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Detail Card */}
        {selectedEntry && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-10 !bg-background text-foreground rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
               style={{ backgroundColor: 'var(--background)' }}>
            <div className="relative h-36 w-full overflow-hidden">
              <Image 
                src={selectedEntry.image} 
                alt={selectedEntry.title}
                width={500}
                height={300}
                className="w-full h-full object-cover"
              />
              <button 
                onClick={closeDetailCard}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                <AlertTriangle size={12} className="mr-1" />
                <span className="capitalize">{selectedEntry.severity}</span>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-bold text-base mb-1">{selectedEntry.title}</h3>
              
              <div className="flex items-center mb-2 text-xs text-foreground/70">
                <div className="flex items-center mr-3">
                  <MapPin size={12} className="mr-1" />
                  <span>{selectedEntry.location}</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={12} className="mr-1" />
                  <span>{new Date(selectedEntry.date).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-xs">
                  <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-1.5 overflow-hidden">
                    {selectedEntry.user?.avatar ? (
                      <Image 
                        src={selectedEntry.user.avatar} 
                        alt={selectedEntry.user.name || 'User'} 
                        width={20}
                        height={20}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                        {selectedEntry.user?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <span>{selectedEntry.user?.name || 'Unknown User'}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-gray-200 dark:border-gray-700">
                  {selectedEntry.type}
                </span>
              </div>
              
              <p className="text-xs text-foreground/70 mb-3 line-clamp-2">
                {selectedEntry.description}
              </p>
              
              <Link 
                href={`/details/${selectedEntry.id}`}
                className="text-xs font-medium text-dalan-yellow hover:underline flex items-center justify-end"
              >
                View Details
                <ChevronRight size={14} className="ml-1" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main page component wrapped in Suspense
export default function MapPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={24} /></div>}>
      <MapContent />
    </Suspense>
  )
}
