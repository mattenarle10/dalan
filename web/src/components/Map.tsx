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
  }, []); // Empty dependency array ensures this only runs once on mount
  
  // Handle markers separately after map is initialized
  useEffect(() => {
    if (!mapInitialized || !mapInstance.current) return;
    
    const addMarkers = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        
        // Clear existing markers (if any)
        const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        // Add new markers
        if (!mapInstance.current) return;
        
        const map = mapInstance.current;
        
        if (markers.length > 0) {
          markers.forEach(marker => {
            // Create custom marker element with severity indicator
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.width = '24px';
            el.style.height = '24px';
            el.style.backgroundImage = 'url(/map-pin.svg)';
            el.style.backgroundSize = 'contain';
            el.style.backgroundRepeat = 'no-repeat';
            el.style.cursor = 'pointer';
            
            // Add severity indicator
            if (marker.severity) {
              const severityColor = marker.severity === 'major' ? '#ef4444' : '#f59e0b';
              el.style.filter = `drop-shadow(0 0 4px ${severityColor})`;
            }
            
            const markerElement = new mapboxgl.Marker(el)
              .setLngLat(marker.position)
              .addTo(map);
            
            // Add click handler if onMarkerClick is provided and marker has ID
            if (onMarkerClick && marker.id) {
              el.addEventListener('click', () => {
                onMarkerClick(marker.id!);
              });
            }
          });
        } else {
          // Add default marker if no markers provided
          const defaultMarker = new mapboxgl.Marker()
            .setLngLat(initialCenter)
            .addTo(map);
        }
      } catch (error) {
        console.error('Error adding markers:', error);
      }
    };
    
    addMarkers();
  }, [mapInitialized, markers, initialCenter]);
  
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
