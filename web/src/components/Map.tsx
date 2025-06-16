'use client'

import { useEffect, useRef, useState } from 'react';
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
}

// Component that loads and displays a Mapbox map
export default function Map({ 
  initialCenter = [120.9842, 14.5995], // Manila coordinates [longitude, latitude]
  zoom = 13,
  markers = [],
  onMapClick,
  onMarkerClick,
  interactive = true
}: MapProps) {
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
          renderWorldCopies: true // Prevents edge cases at world boundaries
        });
        
        // Error handling
        map.on('error', (e) => {
          console.error('Mapbox error:', e.error);
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
  }, [initialCenter, interactive, onMapClick, zoom]); // Include dependencies used in the effect
  
  // Handle markers separately after map is initialized
  useEffect(() => {
    if (!mapInitialized || !mapInstance.current) return;
    
    // Debug log to verify markers are being passed correctly
    console.log('Adding markers:', markers);
    
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
  }, [mapInitialized, markers, onMarkerClick, initialCenter, interactive]);
  
  // Update map center and zoom when props change
  useEffect(() => {
    if (!mapInitialized || !mapInstance.current) return;
    
    // TypeScript null check to ensure mapInstance.current is not null
    const map = mapInstance.current;
    map.setCenter(initialCenter);
    map.setZoom(zoom);
  }, [mapInitialized, initialCenter, zoom]);

  return (
    <div ref={mapContainer} className="w-full h-full rounded-lg" />
  );
}
