import { useRef, useState, useEffect, useCallback } from 'react';
import type { Map as MapboxMap, MapboxOptions } from 'mapbox-gl';

interface UseMapboxOptions {
  initialCenter: [number, number];
  zoom?: number;
  style?: string;
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
          attributionControl: true
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
        console.log('[useMapbox] Removing map instance');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        eventHandlersSetup.current = false;
      }
    };
  }, [initialCenter, zoom, style]);

  // Setup event handlers after map is initialized
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;
    if (eventHandlersSetup.current) return;
    
    const map = mapInstanceRef.current;
    console.log('[useMapbox] Setting up map event handlers');
    eventHandlersSetup.current = true;
    
    // Trigger initial center changed callback
    if (onCenterChanged) {
      setTimeout(() => {
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
        const mapCenter = map.getCenter();
        onCenterChanged([mapCenter.lng, mapCenter.lat]);
      }
    });
    
    map.on('dragend', () => {
      console.log('[useMapbox] Map drag ended');
      isDragging = false;
      
      // Always update coordinates when dragging ends
      if (onCenterChanged) {
        const mapCenter = map.getCenter();
        onCenterChanged([mapCenter.lng, mapCenter.lat]);
      }
    });
    
    // Handle zoom events
    map.on('zoomstart', () => {
      console.log('[useMapbox] Zoom started');
    });
    
    map.on('zoomend', () => {
      console.log('[useMapbox] Zoom ended');
      setCurrentZoom(map.getZoom());
      
      // Update coordinates when zoom ends and not dragging
      if (!isDragging && onCenterChanged) {
        const mapCenter = map.getCenter();
        onCenterChanged([mapCenter.lng, mapCenter.lat]);
      }
    });
    
    // Handle move events
    map.on('moveend', () => {
      // Update coordinates when movement ends and not dragging
      if (!isDragging && onCenterChanged) {
        const mapCenter = map.getCenter();
        onCenterChanged([mapCenter.lng, mapCenter.lat]);
      }
    });
    
    return () => {
      // Cleanup is handled by the main useEffect cleanup
    };
  }, [isLoaded, onCenterChanged]);
  
  // Function to programmatically set map center
  const setMapCenter = useCallback((newCenter: [number, number]) => {
    if (!mapInstanceRef.current || !isLoaded) return;
    console.log('[useMapbox] Setting map center to:', newCenter);
    mapInstanceRef.current.setCenter(newCenter);
    setCenter(newCenter);
  }, [isLoaded]);
  
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
    addMarkers
  };
}
