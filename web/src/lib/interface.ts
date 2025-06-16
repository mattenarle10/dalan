/**
 * Centralized interfaces for the Dalan application
 */

/**
 * Road crack entry interface
 */
export interface RoadCrackEntry {
  id: string
  title: string
  description: string
  location: string
  coordinates: [number, number]
  severity: string
  type: string
  image: string
  classified_image?: string
  created_at: string
  updated_at: string
  user_id: string
  date?: string // Date of the entry (used in dashboard)
  detection_info?: {
    total_cracks: number
    crack_types: Record<string, { count: number, avg_confidence: number }>
  }
  // User information (used in dashboard)
  user?: {
    id: string
    name: string
    isCurrentUser: boolean
    avatar?: string
  }
}

/**
 * Interface for entry update data
 */
export interface EntryUpdateData {
  title?: string
  description?: string
  location?: string
  coordinates?: [number, number]
  severity?: string
  type?: string
}

/**
 * Interface for map filter options
 */
export interface MapFilterOptions {
  severity?: string
  type?: string
  dateRange?: [Date | null, Date | null]
}

/**
 * Interface for success modal props
 */
export interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  entry: RoadCrackEntry | null
  isLoading?: boolean
  progress?: number
}