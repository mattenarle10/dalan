/**
 * API service for communicating with the backend
 */

// Define interface for entry update data
interface EntryUpdateData {
  title?: string;
  description?: string;
  location?: string;
  coordinates?: [number, number];
  severity?: string;
  type?: string;
}

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Fetch all road crack entries with optional filters
 */
export async function getEntries(filters?: {
  user_id?: string;
  severity?: string;
  type?: string;
}) {
  let url = `${API_URL}/api/entries`;
  
  // Add query parameters if filters are provided
  if (filters) {
    const params = new URLSearchParams();
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.type) params.append('type', filters.type);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching entries: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch entries:', error);
    throw error;
  }
}

/**
 * Fetch a single road crack entry by ID
 */
export async function getEntry(entryId: string) {
  try {
    const response = await fetch(`${API_URL}/api/entries/${entryId}`);
    if (!response.ok) {
      throw new Error(`Error fetching entry: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch entry ${entryId}:`, error);
    throw error;
  }
}

/**
 * Create a new road crack entry
 */
export async function createEntry(formData: FormData) {
  try {
    const response = await fetch(`${API_URL}/api/entries`, {
      method: 'POST',
      body: formData, // FormData will be sent as multipart/form-data
    });
    
    if (!response.ok) {
      throw new Error(`Error creating entry: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to create entry:', error);
    throw error;
  }
}

/**
 * Update an existing road crack entry
 */
export async function updateEntry(entryId: string, data: EntryUpdateData) {
  try {
    const response = await fetch(`${API_URL}/api/entries/${entryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Error updating entry: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to update entry ${entryId}:`, error);
    throw error;
  }
}

/**
 * Delete a road crack entry
 */
export async function deleteEntry(entryId: string) {
  try {
    const response = await fetch(`${API_URL}/api/entries/${entryId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error deleting entry: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to delete entry ${entryId}:`, error);
    throw error;
  }
}

/**
 * Get current user information
 */
export async function getCurrentUser() {
  try {
    const response = await fetch(`${API_URL}/api/users/me`);
    if (!response.ok) {
      throw new Error(`Error fetching user: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    throw error;
  }
}
