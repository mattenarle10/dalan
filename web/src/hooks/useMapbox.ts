import { useRef, useState, useEffect, useCallback } from 'react';
import type { Map as MapboxMap, Marker } from 'mapbox-gl';
import MapManager from '@/lib/mapManager';

interface UseMapboxOptions {
  initialCenter: [number, number];
  zoom?: number;
  style?: string;
  interactive?: boolean;
  onCenterChanged?: (coords: [number, number]) => void;
  markers?: Array<{
    position: [number, number]; // [lng, lat]
    popup?: string;
    id?: string;
    severity?: string;
  }>;
  onMarkerClick?: (id: string) => void;
}

/**
 * Custom hook for managing Mapbox map instance and related state
 */
export function useMapbox({
  initialCenter,
  zoom = 13,
  style = 'mapbox://styles/mapbox/streets-v11',
  interactive = true,
  onCenterChanged,
  markers,
  onMarkerClick
}: UseMapboxOptions) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapboxMap | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);
  const eventHandlersSetup = useRef<boolean>(false);
  const mapIdRef = useRef<string>('');
  const markersRef = useRef<Marker[]>([]);

  // Initialize map using MapManager
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized
    
    let isMounted = true;
    
    const initializeMap = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        // Generate unique map ID based on container and current time
        const mapId = `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        mapIdRef.current = mapId;
        
        console.log('[useMapbox] Initializing map with MapManager:', mapId);
        
        const mapManager = MapManager.getInstance();
        const map = await mapManager.getMap(mapId, {
          container: mapContainerRef.current!,
          center: initialCenter,
          zoom: zoom,
          style: style,
          interactive: interactive
        });
        
        if (isMounted) {
          console.log('[useMapbox] Map loaded successfully via MapManager');
          mapInstanceRef.current = map;
          setIsLoaded(true);
          
          // Add navigation controls
          const mapboxgl = (await import('mapbox-gl')).default;
          map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        }
        
      } catch (error) {
        console.error('[useMapbox] Error initializing map:', error);
      }
    };
    
    initializeMap();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (mapIdRef.current && mapInstanceRef.current) {
        console.log('[useMapbox] Cleaning up map instance:', mapIdRef.current);
        const mapManager = MapManager.getInstance();
        mapManager.removeMap(mapIdRef.current);
        mapInstanceRef.current = null;
        eventHandlersSetup.current = false;
      }
    };
  }, [initialCenter, interactive, style, zoom]); // Add missing dependencies

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
  
  // Add markers function with proper marker creation
  const addMarkersToMap = useCallback(async () => {
    if (!mapInstanceRef.current || !isLoaded || !markers) return;
    
    try {
      const mapboxgl = (await import('mapbox-gl')).default;
      const map = mapInstanceRef.current;
      
      // Double check that map is still valid and has the required methods
      if (!map.getCanvasContainer) {
        console.warn('[useMapbox] Map instance is not fully initialized yet, skipping marker addition');
        return;
      }
      
      // Clear existing markers
      markersRef.current.forEach(marker => {
        try {
          marker.remove();
        } catch (e) {
          console.warn('[useMapbox] Error removing existing marker:', e);
        }
      });
      markersRef.current = [];
      
      // Add new markers
      markers.forEach((markerData) => {
        try {
          // Create custom marker element
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.cursor = 'pointer';
          
          // Create SVG for the marker using the map-pin.svg design
          el.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12,0 C16.418278,0 20,3.581722 20,8 C20,12.418278 12,24 12,24 C12,24 4,12.418278 4,8 C4,3.581722 7.581722,0 12,0 Z" 
                    fill="${markerData.severity === 'major' ? '#dc2626' : '#eab308'}" 
                    stroke="#ffffff" 
                    stroke-width="1"/>
              <circle fill="#FFFFFF" cx="12" cy="8" r="4"/>
            </svg>
          `;
          
          // Create marker with error handling
          const marker = new mapboxgl.Marker(el)
            .setLngLat(markerData.position)
            .addTo(map);
          
          // Add click handler
          if (onMarkerClick && markerData.id) {
            el.addEventListener('click', () => {
              onMarkerClick(markerData.id!);
            });
          }
          
          markersRef.current.push(marker);
        } catch (markerError) {
          console.error('[useMapbox] Error adding individual marker:', markerError, 'for marker:', markerData);
        }
      });
    } catch (error) {
      console.error('[useMapbox] Error adding markers:', error);
    }
  }, [isLoaded, markers, onMarkerClick]);

  // Update markers when they change - with delay to ensure map is ready
  useEffect(() => {
    if (isLoaded && mapInstanceRef.current) {
      // Add a small delay to ensure map is fully ready
      const timer = setTimeout(() => {
        addMarkersToMap();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isLoaded, addMarkersToMap]);

  // Add markers function for backward compatibility
  const addMarkers = useCallback((markers: Array<{ 
    coordinates: [number, number]; 
    element?: HTMLElement; 
    popup?: { content: string; offset?: number } 
  }>) => {
    if (!mapInstanceRef.current || !isLoaded) return;
    
    markers.forEach((marker) => {
      // Add marker logic here
      console.log('Adding marker:', marker);
    });
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
