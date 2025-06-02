'use client'
import { useState } from "react";
import dynamic from "next/dynamic";
import { Filter } from "lucide-react";
import { useData } from "@/context/DataContext";

// Dynamically import Map component to avoid SSR issues
const Map = dynamic(
  () => import("@/components/Map"),
  { ssr: false, loading: () => <div className="w-full h-screen bg-gray-100 animate-pulse"></div> }
);

export default function MapPage() {
  const { entries } = useData();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    types: [] as string[],
    severities: [] as string[]
  });

  // Toggle filter modal
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Handle filter changes for both types and severities
  const handleFilterChange = (category: 'types' | 'severities', value: string) => {
    setActiveFilters(prev => {
      const currentValues = prev[category];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [category]: newValues
      };
    });
  };

  // Filter entries based on active filters
  const filteredEntries = entries.filter(entry => {
    // If no filters are active, show all entries
    if (activeFilters.types.length === 0 && activeFilters.severities.length === 0) {
      return true;
    }
    
    // Check if entry matches type filter
    const typeMatch = activeFilters.types.length === 0 || 
      activeFilters.types.includes(entry.type);
    
    // Check if entry matches severity filter
    const severityMatch = activeFilters.severities.length === 0 || 
      activeFilters.severities.includes(entry.severity);
    
    // Return true if entry matches both filters
    return typeMatch && severityMatch;
  });
  
  // Convert entries to marker format for the Map component
  const mapMarkers = filteredEntries.map(entry => ({
    position: entry.coordinates,
    popup: entry.title
  }));

  return (
    <div className="relative h-screen w-full pt-12 md:pt-16">
      {/* Map */}
      <div className="h-full">
        <Map
          initialCenter={[120.9842, 14.5995]} // Manila coordinates
          zoom={12}
          markers={mapMarkers}
        />
      </div>

      {/* Filter Button */}
      <button
        onClick={toggleFilter}
        className="absolute top-20 right-4 z-10 bg-white dark:bg-black p-3 rounded-full shadow-md"
        aria-label="Filter"
      >
        <Filter size={20} className="text-foreground" />
      </button>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="absolute top-20 right-16 z-10 bg-white dark:bg-black p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 w-64">
          <h3 className="font-medium mb-3">Filter Cracks</h3>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Crack Type</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={activeFilters.types.includes('alligator')}
                  onChange={() => handleFilterChange('types', 'alligator')}
                  className="mr-2"
                />
                <span className="text-sm">Alligator</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={activeFilters.types.includes('longitudinal')}
                  onChange={() => handleFilterChange('types', 'longitudinal')}
                  className="mr-2"
                />
                <span className="text-sm">Longitudinal</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={activeFilters.types.includes('transverse')}
                  onChange={() => handleFilterChange('types', 'transverse')}
                  className="mr-2"
                />
                <span className="text-sm">Transverse</span>
              </label>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Severity</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={activeFilters.severities.includes('minor')}
                  onChange={() => handleFilterChange('severities', 'minor')}
                  className="mr-2"
                />
                <span className="text-sm">Minor</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={activeFilters.severities.includes('major')}
                  onChange={() => handleFilterChange('severities', 'major')}
                  className="mr-2"
                />
                <span className="text-sm">Major</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
