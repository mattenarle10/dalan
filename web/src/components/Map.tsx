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
  }>;
}

// Component that loads and displays a Mapbox map
export default function Map({ 
  initialCenter = [120.9842, 14.5995], // Manila coordinates [longitude, latitude]
  zoom = 13,
  markers = []
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
            const markerElement = new mapboxgl.Marker()
              .setLngLat(marker.position)
              .addTo(map);
              
            if (marker.popup) {
              markerElement.setPopup(
                new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`<p>${marker.popup}</p>`)
              );
            }
          });
        } else {
          // Add default marker if no markers provided
          const defaultMarker = new mapboxgl.Marker()
            .setLngLat(initialCenter)
            .addTo(map);
            
          defaultMarker.setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML('<p>Sample road crack location</p>')
          );
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
