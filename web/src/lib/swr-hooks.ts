import useSWR, { mutate as globalMutate } from 'swr';
import { updateEntry, deleteEntry } from './api';
import { EntryUpdateData } from './interface';
import { supabase } from './supabase';

// Generic fetcher function for SWR with auth headers
const fetcher = async (url: string) => {
  // Get current session for auth headers
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add auth header if user is authenticated
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  const res = await fetch(url, { headers });
  
  if (!res.ok) {
    throw new Error(`Error: ${res.status} ${res.statusText}`);
  }
  
  const data = await res.json();
  
  // If user is authenticated, mark their entries
  if (session?.user?.id && Array.isArray(data)) {
    return data.map((entry: { user?: { id: string }; [key: string]: unknown }) => ({
      ...entry,
      user: {
        ...entry.user,
        isCurrentUser: entry.user?.id === session.user.id
      }
    }));
  }
  
  return data;
};

// Hook for fetching all entries
export function useEntries() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  if (!API_URL) {
    throw new Error('API URL is not defined');
  }
  
  const { data, error, isLoading, mutate } = useSWR(
    `${API_URL}/api/entries`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // dedupe requests with the same key in 1 minute
    }
  );
  
  return {
    entries: data,
    isLoading,
    isError: error,
    mutate, // Function to manually revalidate data
  };
}

// Simple fetcher without auth for single entries (public endpoint)
const simpleFetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(`Error: ${res.status} ${res.statusText}`);
  }
  
  return res.json();
};

// Hook for fetching a single entry by ID
export function useEntry(id: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  if (!API_URL) {
    throw new Error('API URL is not defined');
  }
  
  const { data, error, isLoading, mutate } = useSWR(
    id ? `${API_URL}/api/entries/${id}` : null, // Only fetch when ID is available
    simpleFetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // dedupe requests with the same key in 1 minute
    }
  );
  
  // Function to update an entry and revalidate cache
  const updateEntryData = async (updatedData: EntryUpdateData) => {
    try {
      if (!id) throw new Error('Entry ID is required');
      
      // Call the API to update the entry
      const updatedEntry = await updateEntry(id, updatedData);
      
      // Update the cache with the new data
      await mutate(updatedEntry, false);
      
      // Also revalidate the entries list
      await globalMutate(`${API_URL}/api/entries`);
      
      return updatedEntry;
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  };
  
  // Function to delete an entry and update cache
  const deleteEntryData = async () => {
    try {
      if (!id) throw new Error('Entry ID is required');
      
      // Call the API to delete the entry
      await deleteEntry(id);
      
      // Update the entries list cache
      await globalMutate(`${API_URL}/api/entries`);
      
      return true;
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  };
  
  return {
    entry: data,
    isLoading,
    isError: error,
    mutate, // Function to manually revalidate data
    updateEntryData,
    deleteEntryData
  };
}
