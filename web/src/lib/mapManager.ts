/**
 * Map Manager - Centralized map instance management to optimize Mapbox usage
 * This helps prevent unnecessary map loads and manages map limits efficiently
 */

import type { Map as MapboxMap } from 'mapbox-gl';

interface MapConfig {
  container: HTMLElement;
  center: [number, number];
  zoom: number;
  style?: string;
  interactive?: boolean;
}

class MapManager {
  private static instance: MapManager;
  private mapInstances = new Map<string, MapboxMap>();
  private pendingInits = new Map<string, Promise<MapboxMap>>();
  
  static getInstance(): MapManager {
    if (!MapManager.instance) {
      MapManager.instance = new MapManager();
    }
    return MapManager.instance;
  }
  
  /**
   * Get or create a map instance with deduplication
   * This prevents creating multiple maps for the same container
   */
  async getMap(id: string, config: MapConfig): Promise<MapboxMap> {
    // Return existing instance if available
    if (this.mapInstances.has(id)) {
      const existingMap = this.mapInstances.get(id)!;
      console.log(`[MapManager] Reusing existing map instance: ${id}`);
      return existingMap;
    }
    
    // Return pending initialization if in progress
    if (this.pendingInits.has(id)) {
      console.log(`[MapManager] Waiting for pending map initialization: ${id}`);
      return this.pendingInits.get(id)!;
    }
    
    // Create new map instance
    const mapPromise = this.createMap(id, config);
    this.pendingInits.set(id, mapPromise);
    
    try {
      const map = await mapPromise;
      this.mapInstances.set(id, map);
      this.pendingInits.delete(id);
      console.log(`[MapManager] Created new map instance: ${id}`);
      return map;
    } catch (error) {
      this.pendingInits.delete(id);
      throw error;
    }
  }
  
  private async createMap(id: string, config: MapConfig): Promise<MapboxMap> {
    if (typeof window === 'undefined') {
      throw new Error('Map can only be created in browser environment');
    }
    
    try {
      const mapboxgl = (await import('mapbox-gl')).default;
      
      // Configure access token
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
      
      const map = new mapboxgl.Map({
        container: config.container,
        style: config.style || 'mapbox://styles/mapbox/streets-v11',
        center: config.center,
        zoom: config.zoom,
        attributionControl: true,
        interactive: config.interactive ?? true,
        // Performance optimizations to reduce API usage
        antialias: false,
        maxZoom: 18,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
        // Cache settings
        renderWorldCopies: false
      });
      
      // Add cleanup handler
      map.on('remove', () => {
        console.log(`[MapManager] Map instance removed: ${id}`);
        this.mapInstances.delete(id);
      });
      
      return new Promise((resolve, reject) => {
        map.on('load', () => resolve(map));
        map.on('error', (e) => reject(e.error));
      });
      
    } catch (error) {
      console.error(`[MapManager] Failed to create map ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Remove a map instance and clean up resources
   */
  removeMap(id: string): void {
    const map = this.mapInstances.get(id);
    if (map) {
      map.remove();
      this.mapInstances.delete(id);
      console.log(`[MapManager] Removed map instance: ${id}`);
    }
  }
  
  /**
   * Get statistics about current map usage
   */
  getStats(): { activeInstances: number; pendingInits: number } {
    return {
      activeInstances: this.mapInstances.size,
      pendingInits: this.pendingInits.size
    };
  }
  
  /**
   * Utility to debounce map updates (for drag events)
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
}

export default MapManager; 