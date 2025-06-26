import { useState, useCallback, useRef } from 'react';
import debounce from 'lodash/debounce';

/**
 * Location search result interface
 */
export interface LocationSearchResult {
  place_name: string;
  center: [number, number];
  id: string;
}

/**
 * Custom hook for searching locations and reverse geocoding using Mapbox
 */
export function useLocationSearch() {
  // State for search results
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Create a ref for the abort controller to cancel in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);
  
  /**
   * Search for locations based on a query string
   */
  const searchLocation = useCallback(async (query: string) => {
    // Skip empty queries
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create a new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      // Get Mapbox token
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      
      // Make the API request
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=5`,
        { signal }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Format search results
        const formattedResults: LocationSearchResult[] = data.features.map((feature: any) => ({
          id: feature.id,
          place_name: feature.place_name,
          center: feature.center as [number, number]
        }));
        
        setSearchResults(formattedResults);
      }
    } catch (error) {
      // Ignore AbortError as it's expected behavior
      if ((error as Error).name !== 'AbortError') {
        console.error('[useLocationSearch] Error searching location:', error);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  /**
   * Debounced version of the search function to prevent too many API calls
   */
  const debouncedSearchLocation = useCallback(
    debounce((query: string) => searchLocation(query), 300),
    [searchLocation]
  );
  
  /**
   * Updates search query and triggers a search
   */
  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
    debouncedSearchLocation(query);
  }, [debouncedSearchLocation]);
  
  /**
   * Reverse geocode coordinates to get a location name
   */
  const reverseGeocode = useCallback(async (coords: [number, number]): Promise<string> => {
    setIsSearching(true);
    
    try {
      const [lng, lat] = coords;
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      console.log('[useLocationSearch] Reverse geocoding coordinates:', lng, lat);
      
      // Make the API request
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Return the place name if available
        if (data.features && data.features.length > 0) {
          return data.features[0].place_name;
        }
      }
      
      // Fallback to coordinates if reverse geocoding fails
      return `Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch (error) {
      console.error('[useLocationSearch] Error in reverse geocoding:', error);
      const [lng, lat] = coords;
      return `Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  /**
   * Debounced version of reverse geocoding to prevent too many API calls
   */
  const debouncedReverseGeocode = useCallback(
    debounce((coords: [number, number], callback: (location: string) => void) => {
      reverseGeocode(coords).then(callback);
    }, 500),
    [reverseGeocode]
  );
  
  /**
   * Get current location using browser geolocation API
   */
  const getCurrentLocation = useCallback(async (): Promise<{
    coordinates: [number, number];
    locationName: string;
  } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error('[useLocationSearch] Geolocation is not supported by this browser');
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { longitude, latitude } = position.coords;
          const coordinates: [number, number] = [longitude, latitude];
          
          // Get location name for these coordinates
          const locationName = await reverseGeocode(coordinates);
          
          resolve({
            coordinates,
            locationName,
          });
        },
        (error) => {
          console.error('[useLocationSearch] Error getting current location:', error);
          resolve(null);
        },
        { enableHighAccuracy: true }
      );
    });
  }, [reverseGeocode]);
  
  return {
    searchQuery,
    searchResults,
    isSearching,
    setSearchQuery: handleSearchQueryChange,
    searchLocation,
    reverseGeocode,
    debouncedReverseGeocode,
    getCurrentLocation,
  };
}
