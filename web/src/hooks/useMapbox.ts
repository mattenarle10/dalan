import { useRef, useState, useEffect, useCallback } from 'react';
import type { Map as MapboxMap, MapboxOptions } from 'mapbox-gl';

interface UseMapboxOptions {
  initialCenter: [number, number];
  zoom?: number;
  style?: string;
  interactive?: boolean;
  markers?: Array<{
    coordinates: [number, number];
    element?: HTMLElement;
    popup?: {
      content: string;
      offset?: number;
    };
  }>;
  onCenterChanged?: (coords: [number, number]) => void;
}

/**
 * Custom hook for managing Mapbox map instance and related state
 */
export function useMapbox({
  initialCenter,
  zoom = 13,
  style = 'mapbox://styles/mapbox/streets-v11',
  interactive = true,
  markers,
  onCenterChanged
}: UseMapboxOptions) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapboxMap | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);
  const eventHandlersSetup = useRef<boolean>(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;
    
    let isMounted = true;
    
    const initializeMap = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        // Import mapbox-gl dynamically to avoid SSR issues
        const mapboxgl = (await import('mapbox-gl')).default;
        console.log('[useMapbox] Initializing map');
        
        // Configure Mapbox
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
        
        // Create map instance
        const map = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: style,
          center: initialCenter,
          zoom: zoom,
          attributionControl: true,
          interactive: interactive
        });
        
        // Handle map load event
        map.on('load', () => {
          if (isMounted) {
            console.log('[useMapbox] Map loaded successfully');
            mapInstanceRef.current = map;
            setIsLoaded(true);
          }
        });
        
        // Add error handler
        map.on('error', (e) => {
          console.error('[useMapbox] Mapbox error:', e.error);
        });
        
        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
      } catch (error) {
        console.error('[useMapbox] Error initializing map:', error);
      }
    };
    
    initializeMap();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        console.log('[useMapbox] Removing map instance due to component unmount');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        eventHandlersSetup.current = false;
      }
    };
  }, [initialCenter, zoom, style, interactive]);

  // Setup event handlers after map is initialized
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;
    if (eventHandlersSetup.current) return;
    
    // Skip setting up event handlers if map is not interactive
    if (!interactive) {
      console.log('[useMapbox] Map is not interactive, skipping event handlers');
      return;
    }
    
    const map = mapInstanceRef.current;
    console.log('[useMapbox] Setting up map event handlers');
    eventHandlersSetup.current = true;
    
    // Trigger initial center changed callback
    if (onCenterChanged) {
      setTimeout(() => {
        if (!map || !mapInstanceRef.current) return;
        const mapCenter = map.getCenter();
        onCenterChanged([mapCenter.lng, mapCenter.lat]);
      }, 100);
    }
    
    // Track when map is being dragged
    let isDragging = false;
    
    // Add event handlers
    map.on('dragstart', () => {
      console.log('[useMapbox] Map drag started');
      isDragging = true;
    });
    
    map.on('drag', () => {
      // Update coordinates in real-time during dragging
      if (onCenterChanged) {
        try {
          const mapCenter = map.getCenter();
          const newCenter: [number, number] = [mapCenter.lng, mapCenter.lat];
          console.log('[useMapbox:drag] New center:', newCenter);
          
          // Always update local state and notify parent, even over water
          setCenter([...newCenter]); // Update local state with fresh array
          
          // Use requestAnimationFrame to ensure smooth UI updates
          requestAnimationFrame(() => {
            onCenterChanged([...newCenter]); // Notify parent with fresh array
          });
        } catch (e) {
          console.error('[useMapbox] Error during drag event:', e);
        }
      }
    });
    
    map.on('dragend', () => {
      console.log('[useMapbox] Map drag ended');
      isDragging = false;
      
      // Always update coordinates when dragging ends
      if (onCenterChanged) {
        try {
          const mapCenter = map.getCenter();
          const newCenter: [number, number] = [mapCenter.lng, mapCenter.lat];
          console.log('[useMapbox:dragend] Final center:', newCenter);
          
          // Update local state with fresh array
          setCenter([...newCenter]);
          
          // Ensure UI updates with the final position
          requestAnimationFrame(() => {
            onCenterChanged([...newCenter]); // Notify parent with fresh array
          });
        } catch (e) {
          console.error('[useMapbox] Error during dragend event:', e);
        }
      }
    });
    
    // Handle zoom events
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
      
      // Update coordinates when zoom ends and not dragging
      if (!isDragging && onCenterChanged) {
        const mapCenter = map.getCenter();
        onCenterChanged([mapCenter.lng, mapCenter.lat]);
      }
    });
    
    // Return cleanup function - but don't remove the map instance
    return () => {
      console.log('[useMapbox] Cleaning up event handlers');
      eventHandlersSetup.current = false;
    };
  }, [isLoaded, onCenterChanged, interactive]);
  
  // Function to programmatically set map center
  const setMapCenter = useCallback((newCenter: [number, number], updateCamera = true) => {
    if (!mapInstanceRef.current || !isLoaded) return;
    console.log('[useMapbox] Setting center to:', newCenter, 'updateCamera:', updateCamera);
    
    // Ensure we're working with valid coordinates
    if (!Array.isArray(newCenter) || newCenter.length !== 2 || 
        isNaN(newCenter[0]) || isNaN(newCenter[1])) {
      console.error('[useMapbox] Invalid coordinates:', newCenter);
      return;
    }
    
    try {
      // Create a fresh copy of coordinates to ensure state updates
      const freshCenter: [number, number] = [newCenter[0], newCenter[1]];
      
      // Update local state with fresh array
      setCenter(freshCenter);
      
      // Optionally update the camera position
      if (updateCamera) {
        mapInstanceRef.current.setCenter(freshCenter);
      }
      
      // Also trigger the onCenterChanged callback if provided
      if (onCenterChanged) {
        // Use requestAnimationFrame to ensure smooth UI updates
        requestAnimationFrame(() => {
          onCenterChanged(freshCenter);
        });
      }
    } catch (error) {
      console.error('[useMapbox] Error setting center:', error);
    }
  }, [isLoaded, onCenterChanged]);
  
  // Function to add markers to the map
  const addMarkers = useCallback(async (markers: UseMapboxOptions['markers']) => {
    if (!mapInstanceRef.current || !markers || !isLoaded) return;
    
    try {
      const mapboxgl = (await import('mapbox-gl')).default;
      const map = mapInstanceRef.current;
      
      // Clear existing markers
      const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
      existingMarkers.forEach((marker) => marker.remove());
      
      // Add new markers
      markers.forEach((marker) => {
        if (marker.element) {
          // Custom element marker
          new mapboxgl.Marker(marker.element)
            .setLngLat(marker.coordinates)
            .addTo(map);
        } else {
          // Default marker
          const markerInstance = new mapboxgl.Marker()
            .setLngLat(marker.coordinates)
            .addTo(map);
            
          // Add popup if specified
          if (marker.popup) {
            const popup = new mapboxgl.Popup({ 
              offset: marker.popup.offset || 25,
              closeButton: false
            })
            .setHTML(marker.popup.content);
            
            markerInstance.setPopup(popup);
          }
        }
      });
    } catch (error) {
      console.error('[useMapbox] Error adding markers:', error);
    }
  }, [isLoaded]);
  
  return {
    mapContainerRef,
    mapInstance: mapInstanceRef.current,
    isLoaded,
    center,
    zoom: currentZoom,
    setCenter: setMapCenter,
    addMarkers,
    // Method to get the current center from the map directly
    getCurrentMapCenter: useCallback(() => {
      if (!mapInstanceRef.current) return initialCenter;
      const mapCenter = mapInstanceRef.current.getCenter();
      return [mapCenter.lng, mapCenter.lat] as [number, number];
    }, [initialCenter])
  };
}
