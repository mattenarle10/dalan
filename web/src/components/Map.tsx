'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';

interface MapProps {
  // Mapbox uses [longitude, latitude] format
  initialCenter?: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: Array<{
    position: [number, number]; // [lng, lat]
    popup?: string;
    id?: string;
    severity?: string;
  }>;
  onMapClick?: (coordinates: [number, number]) => void;
  onMarkerClick?: (id: string) => void;
  interactive?: boolean;
  centerPin?: boolean; // Whether to show a fixed pin at the center of the map
  onCenterChanged?: (coordinates: [number, number]) => void; // Called when map center changes (for drag-to-position)
}

// Component that loads and displays a Mapbox map
// Using forwardRef to expose the map instance and methods to parent components
const Map = forwardRef(({ 
  initialCenter = [120.9842, 14.5995], // Manila coordinates [longitude, latitude]
  zoom = 13,
  markers = [],
  onMapClick,
  onMarkerClick,
  interactive = true,
  centerPin = false,
  onCenterChanged
}: MapProps, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapboxMap | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Initialize map when component mounts
  useEffect(() => {
    if (mapInstance.current || !mapContainer.current) return;
    
    let isMounted = true;
    
    // Initialize map
    const initializeMap = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        // Import mapbox-gl dynamically to avoid SSR issues
        const mapboxgl = (await import('mapbox-gl')).default;
        
        // Set access token from environment variable
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
        
        // Create new map instance with error handling
        const map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: initialCenter,
          zoom: zoom,
          attributionControl: true,
          preserveDrawingBuffer: true, // Helps with certain rendering issues
          failIfMajorPerformanceCaveat: false, // More permissive rendering
          renderWorldCopies: true, // Prevents edge cases at world boundaries
          trackResize: true,
          maxZoom: 18
        });
        
        // Prevent error callback issues
        map.on('error', (e) => {
          console.error('Mapbox error:', e.error);
        });
        
        // Add error handler to prevent uncaught errors
        map.on('load', () => {
          // Override the default error handler
          // @ts-ignore - Accessing internal property to prevent errors
          if (map._requestManager) {
            // @ts-ignore
            map._requestManager.errorCallback = () => {
              console.warn('Handled map error');
              return true; // Prevent uncaught error
            };
          }
        });
        
        // Only update state if component is still mounted
        if (isMounted) {
          // Save map instance to ref
          mapInstance.current = map;
          
          // Wait for map to load before adding markers
          map.on('load', () => {
            if (isMounted) {
              setMapInitialized(true);
            }
          });
          
          // Add navigation controls
          map.addControl(new mapboxgl.NavigationControl(), 'top-right');
          
          // Add click event handler if interactive and onMapClick is provided
          if (interactive && onMapClick) {
            map.on('click', (e) => {
              const { lng, lat } = e.lngLat;
              onMapClick([lng, lat]);
            });
            
            // Change cursor to pointer when hovering over map
            map.getCanvas().style.cursor = 'pointer';
          }
          
          // Add move end event handler if centerPin and onCenterChanged are provided
          if (centerPin && onCenterChanged) {
            // Initial call to set the location based on the initial center
            setTimeout(() => {
              const center = map.getCenter();
              onCenterChanged([center.lng, center.lat]);
            }, 500);
            
            // Update when map movement ends
            map.on('moveend', () => {
              const center = map.getCenter();
              onCenterChanged([center.lng, center.lat]);
            });
          }
        }
      } catch (error) {
        console.error('Error initializing Mapbox map:', error);
      }
    };
    
    initializeMap();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [initialCenter, interactive, onMapClick, zoom, centerPin, onCenterChanged]); // Include dependencies used in the effect
  
  // Handle markers separately after map is initialized
  useEffect(() => {
    if (!mapInitialized || !mapInstance.current) return;
    
    // Skip adding markers if using centerPin mode
    if (centerPin) return;
    
    const addMarkers = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        
        // Clear existing markers (if any)
        const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        // Add new markers
        if (!mapInstance.current) return;
        
        const map = mapInstance.current;
        
        if (markers && markers.length > 0) {
          markers.forEach(marker => {
            // Create a simple visible marker element
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.width = '30px';
            el.style.height = '30px';
            el.style.backgroundImage = 'url(/map-pin.svg)';
            el.style.backgroundSize = 'contain';
            el.style.backgroundRepeat = 'no-repeat';
            el.style.cursor = 'pointer';
            
            // Make sure marker is visible with high contrast
            el.style.filter = 'drop-shadow(0 0 2px rgba(0,0,0,0.5))';
            
            // Set color based on severity
            if (marker.severity === 'major') {
              el.style.color = '#FF0000'; // Bright red for visibility
            } else {
              el.style.color = '#FFCB14'; // Dalan yellow
            }
            
            // Create and add the marker
            try {
              const mapMarker = new mapboxgl.Marker(el)
                .setLngLat(marker.position)
                .addTo(map);
              
              console.log('Marker added at position:', marker.position);
              
              // Add click handler if onMarkerClick is provided and marker has ID
              if (onMarkerClick && marker.id) {
                el.addEventListener('click', () => {
                  onMarkerClick(marker.id!);
                });
              }
            } catch (markerError) {
              console.error('Error adding individual marker:', markerError);
            }
          });
        } else if (interactive) {
          // Add default marker at initial center if no markers provided and map is interactive
          console.log('No markers provided, adding default marker at:', initialCenter);
          new mapboxgl.Marker()
            .setLngLat(initialCenter)
            .addTo(map);
        }
      } catch (error) {
        console.error('Error adding markers:', error);
      }
    };
    
    addMarkers();
  }, [mapInitialized, markers, onMarkerClick, initialCenter, interactive, centerPin]);
  
  // Update map center and zoom when props change
  useEffect(() => {
    if (!mapInitialized || !mapInstance.current) return;
    
    // TypeScript null check to ensure mapInstance.current is not null
    const map = mapInstance.current;
    map.setCenter(initialCenter);
    map.setZoom(zoom);
  }, [mapInitialized, initialCenter, zoom]);

  // Expose methods to parent components using useImperativeHandle
  useImperativeHandle(ref, () => ({
    // Expose the map instance
    mapInstance: mapInstance.current,
    // Method to set the center of the map
    setCenter: (coordinates: [number, number]) => {
      if (mapInstance.current) {
        mapInstance.current.setCenter(coordinates);
      }
    },
    // Method to get the current center of the map
    getCenter: () => {
      if (mapInstance.current) {
        const center = mapInstance.current.getCenter();
        return [center.lng, center.lat] as [number, number];
      }
      return initialCenter;
    },
    // Method to check if map is initialized
    isInitialized: () => mapInitialized
  }), [mapInitialized]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {/* Fixed center pin that stays in the middle of the map */}
      {centerPin && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="w-10 h-10 flex items-center justify-center">
            <div 
              className="w-8 h-8 bg-contain bg-no-repeat" 
              style={{ 
                backgroundImage: 'url(/map-pin.svg)',
                filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))',
                transform: 'translateY(-50%)' // Adjust pin position to point at exact center
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

// Export the Map component
export default Map;
