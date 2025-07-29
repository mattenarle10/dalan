'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Sun, Moon, UserCircle, LogIn } from 'lucide-react'
import { LocationPlus, Grid, Map } from '@mynaui/icons-react'
import { useAuthContext } from '@/contexts/AuthContext'

export default function Navbar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const { user, loading } = useAuthContext()
  
  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark')
  }

  // Initialize theme on component mount
  useEffect(() => {
    // Check if user prefers dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      setTheme('dark')
      document.documentElement.classList.add('dark')
    }
  }, [])
  
  // Use state for client-side rendering to prevent hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine auth link and label
  const authLink = !loading && user ? '/profile' : '/auth'
  const authLabel = !loading && user ? 'Profile' : 'Login'
  const AuthIcon = !loading && user ? UserCircle : LogIn

  return (
    <>
      {/* Top navbar for mobile - contains logo and theme toggle */}
      <nav className="md:hidden fixed top-0 z-50 w-full !bg-background text-foreground border-b border-border backdrop-blur-md bg-opacity-80 shadow-sm" style={{ backgroundColor: 'var(--background)' }}>
        <div className="px-4 py-2">
          <div className="flex items-center justify-between h-12">
            {/* Left: Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="font-bold text-lg tracking-wider text-foreground hover:opacity-80 transition-opacity">
                dalan
              </Link>
            </div>
            
            {/* Right: Theme toggle */}
            <div className="flex-shrink-0">
              <button 
                onClick={toggleTheme}
                className="p-1.5 rounded-md hover:bg-muted/60 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon size={18} className="text-foreground" />
                ) : (
                  <Sun size={18} className="text-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Bottom navbar for mobile - contains navigation icons */}
      <nav className="md:hidden fixed bottom-0 z-50 w-full !bg-background text-foreground border-t border-border shadow-lg" style={{ backgroundColor: 'var(--background)' }}>
        <div className="px-2">
          <div className="flex items-center justify-around h-16">
            <Link href="/dashboard" className="flex flex-col items-center p-1 rounded-lg hover:bg-muted/60 transition-colors">
              <Grid size={22} className="text-foreground mb-0.5" />
              <span className="text-xs font-medium">{mounted ? 'Dashboard' : 'Home'}</span>
            </Link>
            <Link href="/add" className="flex flex-col items-center p-1 rounded-lg hover:bg-muted/60 transition-colors">
              <LocationPlus size={22} className="text-foreground mb-0.5" />
              <span className="text-xs font-medium">Add</span>
            </Link>
            <Link href="/map" className="flex flex-col items-center p-1 rounded-lg hover:bg-muted/60 transition-colors">
              <Map size={22} className="text-foreground mb-0.5" />
              <span className="text-xs font-medium">Map</span>
            </Link>
            <Link href={authLink} className="flex flex-col items-center p-1 rounded-lg hover:bg-muted/60 transition-colors">
              <AuthIcon size={22} className="text-foreground mb-0.5" />
              <span className="text-xs font-medium">{mounted ? authLabel : 'Account'}</span>
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Desktop navbar */}
      <nav className="hidden md:block sticky top-0 z-50 w-full !bg-background text-foreground border-b border-border backdrop-blur-md bg-opacity-80" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo on left */}
            <div className="flex-shrink-0">
              <Link href="/" className="font-bold text-xl tracking-wider text-foreground hover:opacity-80 transition-opacity">
                dalan
              </Link>
            </div>
            
            {/* Navigation links centered */}
            <div className="flex justify-center space-x-1">
              <Link 
                href="/dashboard" 
                className="flex items-center px-3 py-2 rounded-md hover:bg-muted/60 transition-colors text-sm font-medium"
              >
                <Grid size={18} className="text-foreground mr-1.5" />
                <span>{mounted ? 'Dashboard' : 'Home'}</span>
              </Link>
              <Link 
                href="/add" 
                className="flex items-center px-3 py-2 rounded-md hover:bg-muted/60 transition-colors text-sm font-medium"
              >
                <LocationPlus size={18} className="text-foreground mr-1.5" />
                <span>Add</span>
              </Link>
              <Link 
                href="/map" 
                className="flex items-center px-3 py-2 rounded-md hover:bg-muted/60 transition-colors text-sm font-medium"
              >
                <Map size={18} className="text-foreground mr-1.5" />
                <span>Map</span>
              </Link>
              <Link 
                href={authLink} 
                className="flex items-center px-3 py-2 rounded-md hover:bg-muted/60 transition-colors text-sm font-medium"
              >
                <AuthIcon size={18} className="text-foreground mr-1.5" />
                <span>{mounted ? authLabel : 'Account'}</span>
              </Link>
            </div>
            
            {/* Theme toggle on right */}
            <div>
              <button 
                onClick={toggleTheme}
                className="p-1.5 rounded-md hover:bg-muted/60 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon size={18} className="text-foreground" />
                ) : (
                  <Sun size={18} className="text-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
