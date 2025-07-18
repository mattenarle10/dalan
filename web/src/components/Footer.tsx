'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="w-full !bg-background text-foreground border-t border-border pt-6 pb-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row justify-between items-center">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="text-sm text-foreground/70 hover:text-foreground ion-colors">Dashboard</Link>
            <Link href="/map" className="text-sm text-foreground/70 hover:text-foreground ion-colors">Map</Link>
            <Link href="/add" className="text-sm text-foreground/70 hover:text-foreground ion-colors">Add Entry</Link>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm text-foreground/70">
              Developed by <span className="font-medium">Matthew Enarle & Alecxander Jamille Andaya</span>
            </span>
          </div>
        </div>
        
        <div className="text-center text-xs text-foreground/50 mt-4">
          © {new Date().getFullYear()} Dalan. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
