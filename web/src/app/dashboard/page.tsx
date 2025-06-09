'use client'
import { useState } from "react";
import Image from "next/image";
import { MapPin, Calendar, Tag, AlertTriangle, Filter, User, Users, Search, X, ChevronDown, MapIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import Modal from "@/components/modal/Modal";
import { RoadCrackEntry } from "@/context/DataContext";
import { useEntries } from "@/lib/swr-hooks";

export default function Dashboard() {
  const { entries = [], isLoading: loading, isError: error } = useEntries();
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter entries based on selected filters
  const filteredEntries = entries.filter((entry: RoadCrackEntry) => {
    // View mode filter (All vs My Entries)
    if (viewMode === 'my' && !entry.user.isCurrentUser) return false;
    
    // Type filter
    if (typeFilter !== 'all' && entry.type.toLowerCase() !== typeFilter.toLowerCase()) return false;
    
    // Severity filter
    if (severityFilter !== 'all' && entry.severity.toLowerCase() !== severityFilter.toLowerCase()) return false;
    
    // Search query
    if (searchQuery && !entry.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !entry.location.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  // Reset all filters
  const resetFilters = () => {
    setTypeFilter('all');
    setSeverityFilter('all');
    setSearchQuery('');
    setViewMode('all');
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto p-4 pt-20 pb-24 md:pt-24 md:pb-8">
      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
          <p className="font-medium">Error loading entries</p>
          <p className="text-sm">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      )}
      
      {/* Dashboard Header with Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Community</h1>
          <p className="text-sm text-foreground/70">Recent road crack reports from the community</p>
        </div>
        
        <div className="mt-4 md:mt-0 w-full md:w-auto flex items-center">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search by title or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-card text-sm"
            />
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/50 hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <button 
            onClick={() => setIsFilterModalOpen(true)}
            className="ml-2 p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-card hover:bg-card/80 transition-colors"
            aria-label="Open filters"
          >
            <Filter size={18} className="text-foreground/70" />
          </button>
        </div>
      </div>
      
      {/* View Mode Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 mb-4">
        <button 
          onClick={() => setViewMode('all')} 
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${viewMode === 'all' ? 'text-foreground' : 'text-foreground/50 hover:text-foreground/70'}`}
        >
          <div className="flex items-center">
            <Users size={16} className="mr-2" />
            All Entries
          </div>
          {viewMode === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-dalan-yellow"></div>}
        </button>
        <button 
          onClick={() => setViewMode('my')} 
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${viewMode === 'my' ? 'text-foreground' : 'text-foreground/50 hover:text-foreground/70'}`}
        >
          <div className="flex items-center">
            <User size={16} className="mr-2" />
            My Entries
          </div>
          {viewMode === 'my' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-dalan-yellow"></div>}
        </button>
      </div>
      
      {/* Filter Modal */}
      <Modal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Entries"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Crack Type</label>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-background text-sm"
            >
              <option value="all">All Types</option>
              <option value="alligator">Alligator</option>
              <option value="longitudinal">Longitudinal</option>
              <option value="transverse">Transverse</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Severity</label>
            <select 
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-background text-sm"
            >
              <option value="all">All Severities</option>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
            </select>
          </div>
          
          <div className="flex justify-between pt-4">
            <button 
              onClick={resetFilters}
              className="px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Reset
            </button>
            
            <button 
              onClick={() => setIsFilterModalOpen(false)}
              className="px-4 py-2 rounded-md bg-dalan-yellow text-black text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Quick Type Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button 
          onClick={() => setTypeFilter('all')} 
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === 'all' ? 'bg-dalan-yellow text-black' : 'bg-card border border-gray-200 dark:border-gray-800 hover:bg-card/80'}`}
        >
          All Types
        </button>
        <button 
          onClick={() => setTypeFilter('alligator')} 
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === 'alligator' ? 'bg-dalan-yellow text-black' : 'bg-card border border-gray-200 dark:border-gray-800 hover:bg-card/80'}`}
        >
          Alligator
        </button>
        <button 
          onClick={() => setTypeFilter('longitudinal')} 
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === 'longitudinal' ? 'bg-dalan-yellow text-black' : 'bg-card border border-gray-200 dark:border-gray-800 hover:bg-card/80'}`}
        >
          Longitudinal
        </button>
        <button 
          onClick={() => setTypeFilter('transverse')} 
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === 'transverse' ? 'bg-dalan-yellow text-black' : 'bg-card border border-gray-200 dark:border-gray-800 hover:bg-card/80'}`}
        >
          Transverse
        </button>
      </div>
      
      {/* Entry Cards */}
      {loading ? (
        /* Skeleton UI - Shown when loading */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className="bg-card border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden animate-pulse" 
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Skeleton header */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-2"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
              {/* Skeleton image */}
              <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                <div className="absolute top-2 left-2 h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>
              {/* Skeleton content */}
              <div className="p-4">
                <div className="flex justify-between mb-3">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-3"></div>
              </div>
              {/* Skeleton footer */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
            </div>
          ))}
          
        </div>
      ) : (
        /* Actual entries - Shown when loaded */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filteredEntries.map((entry: RoadCrackEntry) => (
          <div key={entry.id} className="bg-card rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col h-full">
            {/* Card Header with User Info */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-2 flex-shrink-0">
                  {entry.user.name === 'Matthew Enarle' ? (
                    <img 
                      src="/placeholders/matt.png" 
                      alt="Matthew Enarle" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                      {entry.user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{entry.user.name}</p>
                  <p className="text-xs text-foreground/50">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
              </div>
              
              {entry.user.isCurrentUser && (
                <span className="text-xs bg-dalan-yellow/20 text-dalan-yellow px-2 py-0.5 rounded-full">
                  Your Entry
                </span>
              )}
            </div>
            
            {/* Image with Map Overlay */}
            <div className="relative h-48 w-full overflow-hidden">
              {/* Actual image */}
              <img 
                src={entry.image} 
                alt={entry.title}
                className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
              />
              
              {/* Map Button */}
              <Link 
                href={`/map?lat=${entry.coordinates[1]}&lng=${entry.coordinates[0]}&id=${entry.id}`}
                className="absolute top-3 right-3 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 shadow-md hover:scale-105 transition-all flex items-center justify-center"
                aria-label="View on map"
              >
                <MapIcon size={16} />
              </Link>
              
              {/* Severity Badge */}
              <div className="absolute top-2 left-2 z-10 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                <AlertTriangle size={12} className="mr-1" />
                <span className="capitalize">{entry.severity}</span>
              </div>
              
              {/* Gradient overlay for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
            </div>
            
            {/* Content */}
            <div className="p-4 flex-grow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-base">{entry.title}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-card border border-gray-200 dark:border-gray-700">
                  {entry.type}
                </span>
              </div>
              
              <p className="text-sm text-foreground/70 mb-3">{entry.description}</p>
              
              <div className="flex items-center text-xs text-foreground/70">
                <MapPin size={14} className="mr-1" />
                {entry.location}
              </div>
            </div>
            
            {/* Card Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-800">
              <Link 
                href={`/details/${entry.id}`}
                className="text-xs font-medium text-dalan-yellow hover:underline flex items-center"
              >
                View Details
                <ChevronDown size={14} className="ml-1 transform rotate-270" />
              </Link>
            </div>
          </div>
          ))}
        </div>
      )}
      
      {!loading && filteredEntries.length === 0 && (
        <div className="text-center py-12 bg-card rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-foreground/70 mb-2">No entries found with the current filters.</p>
          <button 
            onClick={() => {
              setTypeFilter('all');
              setSeverityFilter('all');
              setSearchQuery('');
              setViewMode('all');
            }}
            className="text-sm text-dalan-yellow hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
