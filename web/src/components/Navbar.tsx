'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { LocationPlus, Grid, Map } from '@mynaui/icons-react'

export default function Navbar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
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

  return (
    <>
      {/* Top navbar for mobile - only contains logo and theme toggle */}
      <nav className="md:hidden fixed top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between h-12">
            {/* Left: Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="font-bold text-lg tracking-wider text-foreground">
                dalan
              </Link>
            </div>
            
            {/* Right: Theme toggle */}
            <div className="flex-shrink-0">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon size={20} className="text-gray-700" />
                ) : (
                  <Sun size={20} className="text-gray-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Bottom navbar for mobile - only contains navigation icons */}
      <nav className="md:hidden fixed bottom-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-black/80 border-t border-gray-200 dark:border-gray-800">
        <div className="px-4">
          <div className="flex items-center justify-around h-16">
            <Link href="/dashboard" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Grid size={24} className="text-gray-700 dark:text-gray-300" />
            </Link>
            <Link href="/add" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <LocationPlus size={24} className="text-gray-700 dark:text-gray-300" />
            </Link>
            <Link href="/map" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Map size={24} className="text-gray-700 dark:text-gray-300" />
            </Link>

          </div>
        </div>
      </nav>
      
      {/* Desktop navbar */}
      <nav className="hidden md:block sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-black/70 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo on left */}
            <div className="flex-shrink-0">
              <Link href="/" className="font-bold text-xl tracking-wider text-foreground">
                dalan
              </Link>
            </div>
            
            {/* Icons centered */}
            <div className="flex justify-center space-x-8">
              <Link href="/dashboard" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Grid size={24} className="text-gray-700 dark:text-gray-300" />
              </Link>
              <Link href="/add" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <LocationPlus size={24} className="text-gray-700 dark:text-gray-300" />
              </Link>
              <Link href="/map" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Map size={24} className="text-gray-700 dark:text-gray-300" />
              </Link>

            </div>
            
            {/* Theme toggle on right */}
            <div>
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon size={20} className="text-gray-700" />
                ) : (
                  <Sun size={20} className="text-gray-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
