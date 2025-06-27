'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { useMapbox } from '@/hooks/useMapbox';

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
const Map = forwardRef<{
  mapInstance: MapboxMap | null;
  setCenter: (coordinates: [number, number], updateCamera?: boolean) => void;
  getCenter: () => [number, number];
  isInitialized: () => boolean;
  addMarkers: (markers: Array<{ coordinates: [number, number], element?: HTMLElement, popup?: { content: string, offset?: number } }>) => void;
}, MapProps>(function Map({ 
  initialCenter = [120.9842, 14.5995], // Default coordinates for Manila
  zoom = 13,
  centerPin = false,
  onCenterChanged,
  markers,
  interactive = false,
  onMapClick,
  onMarkerClick,
}, ref) {
  // Use our custom mapbox hook
  const { 
    mapContainerRef,
    mapInstance,
    isLoaded,
    center,
    setCenter,
    addMarkers: addMapMarkers
  } = useMapbox({
    initialCenter,
    zoom,
    onCenterChanged
  });

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    mapInstance,
    
    setCenter: (coordinates: [number, number], updateCamera = true) => {
      console.log('[Map] Setting center to:', coordinates, 'updateCamera:', updateCamera);
      setCenter(coordinates, updateCamera);
    },
    
    getCenter: () => center,
    
    isInitialized: () => isLoaded,
    
    // Add markers to the map
    addMarkers: (markers) => {
      if (!isLoaded) {
        console.warn('[Map] Cannot add markers: Map not initialized');
        return;
      }
      
      addMapMarkers(markers);
    }
  }), [isLoaded, center, setCenter, addMapMarkers]);

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full rounded-lg" />
      
      {/* Fixed center marker (optional) */}
      {centerPin && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="w-10 h-10 flex items-center justify-center">
            <div className="w-8 h-8 bg-contain bg-no-repeat" style={{ 
              backgroundImage: 'url(/map-pin.svg)',
              filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5)) saturate(100%) invert(26%) sepia(95%) saturate(2163%) hue-rotate(342deg) brightness(91%) contrast(95%)',
              transform: 'translateY(-50%)'
            }} />
          </div>
        </div>
      )}
    </div>
  );
});

// Export the Map component
// Add displayName to satisfy the linter
Map.displayName = 'Map';

export default Map;
