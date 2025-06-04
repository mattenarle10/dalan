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
  // Manila entries
  {
    id: '1',
    title: 'Deep crack on Main St',
    description: 'Found this dangerous crack near the school entrance',
    location: 'Main St, Manila',
    coordinates: [120.9842, 14.5995], // Manila
    date: '2025-05-28T08:30:00Z',
    severity: 'major',
    type: 'alligator', // AI determined
    image: '/placeholders/ex1.png',
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
    type: 'longitudinal', 
    image: '/placeholders/ex1.png',
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
    image: '/placeholders/ex1.png', // Using the provided mock image
    user: {
      id: 'user3',
      name: 'Juan Dela Cruz',
      isCurrentUser: false
    }
  },
  
  // Iloilo entries
  {
    id: '4',
    title: 'Severe cracks on Diversion Road',
    description: 'Multiple cracks appearing after recent heavy rains, affecting traffic flow',
    location: 'Diversion Road, Iloilo City',
    coordinates: [122.5726, 10.7202], // Iloilo Diversion Road
    date: '2025-05-25T16:20:00Z',
    severity: 'major',
    type: 'alligator',
    image: '/placeholders/ex1.png',
    user: {
      id: 'user1',
      name: 'Matthew Enarle',
      isCurrentUser: true
    }
  },
  {
    id: '5',
    title: 'Potholes near SM City Iloilo',
    description: 'Several potholes forming in the parking area and main entrance road',
    location: 'SM City, Mandurriao, Iloilo City',
    coordinates: [122.5509, 10.7138], // SM City Iloilo
    date: '2025-05-24T09:10:00Z',
    severity: 'minor',
    type: 'longitudinal',
    image: '/placeholders/ex1.png',
    user: {
      id: 'user2',
      name: 'Alecxander Andaya',
      isCurrentUser: false
    }
  },
  {
    id: '6',
    title: 'Road damage at Iloilo Esplanade',
    description: 'Cracks forming along the walkway, potential safety hazard for pedestrians',
    location: 'Iloilo River Esplanade, Iloilo City',
    coordinates: [122.5684, 10.6968], // Iloilo Esplanade
    date: '2025-05-23T11:30:00Z',
    severity: 'minor',
    type: 'transverse',
    image: '/placeholders/ex1.png',
    user: {
      id: 'user3',
      name: 'Juan Dela Cruz',
      isCurrentUser: false
    }
  },
  {
    id: '7',
    title: 'Major crack on Iznart Street',
    description: 'Large crack running across the entire road width, needs immediate repair',
    location: 'Iznart Street, Iloilo City Proper',
    coordinates: [122.5736, 10.6923], // Iznart Street
    date: '2025-05-22T14:45:00Z',
    severity: 'major',
    type: 'transverse',
    image: '/placeholders/ex1.png',
    user: {
      id: 'user1',
      name: 'Matthew Enarle',
      isCurrentUser: true
    }
  },
  {
    id: '8',
    title: 'Sidewalk damage at Plaza Libertad',
    description: 'Broken sidewalk tiles and cracks around the plaza area',
    location: 'Plaza Libertad, Iloilo City',
    coordinates: [122.5744, 10.6959], // Plaza Libertad
    date: '2025-05-21T10:15:00Z',
    severity: 'minor',
    type: 'alligator',
    image: '/placeholders/ex1.png',
    user: {
      id: 'user2',
      name: 'Alecxander Andaya',
      isCurrentUser: false
    }
  },
  {
    id: '9',
    title: 'Road deterioration near Iloilo Capitol',
    description: 'Extensive road surface deterioration affecting government center access',
    location: 'Iloilo Provincial Capitol, Iloilo City',
    coordinates: [122.5629, 10.7016], // Iloilo Capitol
    date: '2025-05-20T08:30:00Z',
    severity: 'major',
    type: 'longitudinal',
    image: '/placeholders/ex1.png',
    user: {
      id: 'user3',
      name: 'Juan Dela Cruz',
      isCurrentUser: false
    }
  },
  {
    id: '10',
    title: 'Cracks on Molo Church approach',
    description: 'Historical site access road showing signs of deterioration',
    location: 'Molo Church, Iloilo City',
    coordinates: [122.5488, 10.6979], // Molo Church
    date: '2025-05-19T13:20:00Z',
    severity: 'minor',
    type: 'transverse',
    image: '/placeholders/ex1.png',
    user: {
      id: 'user1',
      name: 'Matthew Enarle',
      isCurrentUser: true
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
