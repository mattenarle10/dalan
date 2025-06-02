'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

// Define the entry type
export interface RoadCrackEntry {
  id: string
  title: string
  description: string
  location: string
  coordinates: [number, number] // [longitude, latitude]
  date: string
  severity: 'minor' | 'major'
  type: string // This will be determined by AI
  image: string
  user: {
    id: string
    name: string
    isCurrentUser: boolean
  }
}

// Sample data
const sampleEntries: RoadCrackEntry[] = [
  {
    id: '1',
    title: 'Deep crack on Main ',
    description: 'Found this dangerous crack near the school entrance',
    location: 'Main St, Manila',
    coordinates: [120.9842, 14.5995], // Manila
    date: '2025-05-28T08:30:00Z',
    severity: 'major',
    type: 'alligator', // AI determined
    image: '/cracks/crack1.jpg',
    user: {
      id: 'user1',
      name: 'Matthew Enarle',
      isCurrentUser: true
    }
  },
  {
    id: '2',
    title: 'Small crack on Highway',
    description: 'Noticed this crack while driving, might get worse with rain',
    location: 'EDSA Highway, Quezon City',
    coordinates: [121.0244, 14.6091], // Quezon City
    date: '2025-05-27T14:15:00Z',
    severity: 'minor',
    type: 'longitudinal', // AI determined
    image: '/cracks/crack2.jpg',
    user: {
      id: 'user2',
      name: 'Alecxander Andaya',
      isCurrentUser: false
    }
  },
  {
    id: '3',
    title: 'Road damage near market',
    description: 'This crack is causing problems for vendors and shoppers',
    location: 'Divisoria Market, Manila',
    coordinates: [120.9726, 14.6019], // Divisoria
    date: '2025-05-26T10:45:00Z',
    severity: 'major',
    type: 'transverse', // AI determined
    image: '/cracks/crack3.jpg',
    user: {
      id: 'user3',
      name: 'Juan Dela Cruz',
      isCurrentUser: false
    }
  },
  {
    id: '4',
    title: 'Pothole developing on side street',
    description: 'Small crack turning into a pothole, needs attention',
    location: 'Taft Avenue, Manila',
    coordinates: [120.9799, 14.5649], // Taft
    date: '2025-05-25T16:20:00Z',
    severity: 'minor',
    type: 'alligator', // AI determined
    image: '/cracks/crack4.jpg',
    user: {
      id: 'user1',
      name: 'Matthew Enarle',
      isCurrentUser: true
    }
  },
  {
    id: '5',
    title: 'Extensive cracking on bridge approach',
    description: 'Multiple cracks forming on the approach to the bridge',
    location: 'Guadalupe Bridge, Makati',
    coordinates: [121.0261, 14.5635], // Guadalupe
    date: '2025-05-24T09:10:00Z',
    severity: 'major',
    type: 'longitudinal', // AI determined
    image: '/cracks/crack5.jpg',
    user: {
      id: 'user2',
      name: 'Alecxander Andaya',
      isCurrentUser: false
    }
  },
  {
    id: '6',
    title: 'Sidewalk crack near hospital',
    description: 'Crack making it difficult for patients to access the hospital',
    location: 'Philippine General Hospital, Manila',
    coordinates: [120.9874, 14.5796], // PGH
    date: '2025-05-23T11:30:00Z',
    severity: 'minor',
    type: 'transverse', // AI determined
    image: '/cracks/crack6.jpg',
    user: {
      id: 'user3',
      name: 'Juan Dela Cruz',
      isCurrentUser: false
    }
  }
]

// Define the context type
interface DataContextType {
  entries: RoadCrackEntry[]
  addEntry: (entry: Omit<RoadCrackEntry, 'id' | 'date' | 'type'>) => void
  getCurrentUser: () => { id: string; name: string }
}

// Create the context
const DataContext = createContext<DataContextType | undefined>(undefined)

// Create a provider component
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<RoadCrackEntry[]>([])
  
  // Load sample data on initial render
  useEffect(() => {
    // In a real app, this would fetch from an API or local storage
    setEntries(sampleEntries)
  }, [])
  
  // Get current user (hardcoded for demo)
  const getCurrentUser = () => ({
    id: 'user1',
    name: 'Matthew Enarle'
  })
  
  // Add a new entry
  const addEntry = (entryData: Omit<RoadCrackEntry, 'id' | 'date' | 'type'>) => {
    const currentUser = getCurrentUser()
    
    // Create a new entry with generated ID, current date, and placeholder type
    // In a real app, the type would be determined by AI
    const newEntry: RoadCrackEntry = {
      ...entryData,
      id: `entry-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'alligator', // Placeholder, would be determined by AI
      user: {
        id: currentUser.id,
        name: currentUser.name,
        isCurrentUser: true
      }
    }
    
    setEntries(prevEntries => [newEntry, ...prevEntries])
  }
  
  return (
    <DataContext.Provider value={{ entries, addEntry, getCurrentUser }}>
      {children}
    </DataContext.Provider>
  )
}

// Create a hook for using the context
export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
