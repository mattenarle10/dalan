'use client'
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Map as MapIcon, Grid, MapPin, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import ImageViewer from '@/components/ImageViewer';



export default function Home() {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState({ url: '', alt: '' });
  
  const openImageViewer = (imageUrl: string, altText: string) => {
    setCurrentImage({ url: imageUrl, alt: altText });
    setViewerOpen(true);
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 pt-22 pb-24 md:pt-24 md:pb-8">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mt-2 sm:mt-4 mb-10 sm:mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          <span className="text-dalan-yellow">dalan</span> - AI-Powered Road Crack Detection
        </h1>
        <p className="text-xl text-foreground/70 mb-8 max-w-2xl">
          Helping communities identify, classify, and map road cracks to improve infrastructure maintenance
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/dashboard" 
            className="px-6 py-3 rounded-lg bg-card border border-gray-200 dark:border-white/10 text-foreground font-medium flex items-center justify-center hover:bg-card/80 transition-colors"
          >
            View Dashboard
            <ArrowRight size={18} className="ml-2" />
          </Link>
          <Link 
            href="/add" 
            className="px-6 py-3 rounded-lg bg-card border border-gray-200 dark:border-white/10 text-foreground font-medium flex items-center justify-center hover:bg-card/80 transition-colors"
          >
            Add New Entry
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 w-full max-w-4xl mb-10 sm:mb-16">
        <div className="bg-card p-6 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col items-center text-center">
          <div className="bg-dalan-yellow/20 p-3 rounded-full mb-4">
            <Grid size={24} className="text-dalan-yellow" />
          </div>
          <h3 className="font-bold mb-2">Dashboard View</h3>
          <p className="text-sm text-foreground/70">Browse and filter road crack reports from the community</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col items-center text-center">
          <div className="bg-dalan-yellow/20 p-3 rounded-full mb-4">
            <MapIcon size={24} className="text-dalan-yellow" />
          </div>
          <h3 className="font-bold mb-2">Interactive Map</h3>
          <p className="text-sm text-foreground/70">Visualize road cracks on an interactive map with filtering</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col items-center text-center">
          <div className="bg-dalan-yellow/20 p-3 rounded-full mb-4">
            <MapPin size={24} className="text-dalan-yellow" />
          </div>
          <h3 className="font-bold mb-2">Add New Entries</h3>
          <p className="text-sm text-foreground/70">Submit new road crack reports with AI-powered classification</p>
        </div>
      </div>

      {/* Combined Information Section */}
      <div className="w-full max-w-5xl mb-10 sm:mb-16 bg-card rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-5 sm:p-8 md:p-10">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center">Road Crack Classification Guide</h2>
          
          {/* Crack Types */}
          <div className="mb-8 sm:mb-12">
            <h3 className="text-lg font-semibold mb-6 inline-flex items-center">
              <div className="w-2 h-8 bg-dalan-yellow rounded-full mr-3"></div>
              Types of Road Cracks
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              <div className="flex flex-col">
                <div 
                  className="h-40 bg-gray-200 dark:bg-black/40 rounded-t-lg overflow-hidden flex items-center justify-center cursor-pointer relative group" 
                  onClick={() => openImageViewer('/placeholders/alligator.jpg', 'Alligator crack example')}
                >
  <Image src="/placeholders/alligator.jpg" alt="Alligator crack example" width={400} height={300} className="w-full h-full object-cover rounded-t-lg group-hover:opacity-80 transition-opacity duration-200" />
  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
    <div className="bg-black/50 rounded-full p-2">
      <ZoomIn size={24} className="text-white" />
    </div>
  </div>
</div>
                <div className="p-4 border-t border-gray-200 dark:border-white/20">
                  <h4 className="font-bold mb-1">Alligator Cracks</h4>
                  <p className="text-sm text-foreground/70">
                    Interconnected cracks forming a pattern similar to alligator skin, caused by fatigue failure from repeated traffic loading.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col">
                <div 
                  className="h-40 bg-gray-200 dark:bg-black/40 rounded-t-lg overflow-hidden flex items-center justify-center cursor-pointer relative group" 
                  onClick={() => openImageViewer('/placeholders/longitude.jpg', 'Longitudinal crack example')}
                >
  <Image src="/placeholders/longitude.jpg" alt="Longitudinal crack example" width={400} height={300} className="w-full h-full object-cover rounded-t-lg group-hover:opacity-80 transition-opacity duration-200" />
  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
    <div className="bg-black/50 rounded-full p-2">
      <ZoomIn size={24} className="text-white" />
    </div>
  </div>
</div>
                <div className="p-4 border-t border-gray-200 dark:border-white/20">
                  <h4 className="font-bold mb-1">Longitudinal Cracks</h4>
                  <p className="text-sm text-foreground/70">
                    Cracks that run parallel to the road&apos;s centerline, often caused by poor joint construction or temperature cycles.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col">
                <div 
                  className="h-40 bg-gray-200 dark:bg-black/40 rounded-t-lg overflow-hidden flex items-center justify-center cursor-pointer relative group" 
                  onClick={() => openImageViewer('/placeholders/transverse.jpeg', 'Transverse crack example')}
                >
  <Image src="/placeholders/transverse.jpeg" alt="Transverse crack example" width={400} height={300} className="w-full h-full object-cover rounded-t-lg group-hover:opacity-80 transition-opacity duration-200" />
  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
    <div className="bg-black/50 rounded-full p-2">
      <ZoomIn size={24} className="text-white" />
    </div>
  </div>
</div>
                <div className="p-4 border-t border-gray-200 dark:border-white/20">
                  <h4 className="font-bold mb-1">Transverse Cracks</h4>
                  <p className="text-sm text-foreground/70">
                    Cracks that run perpendicular to the road&apos;s centerline, usually caused by thermal shrinkage or underlying cracks.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col">
                <div 
                  className="h-40 bg-gray-200 dark:bg-black/40 rounded-t-lg overflow-hidden flex items-center justify-center cursor-pointer relative group" 
                  onClick={() => openImageViewer('/placeholders/pothole.jpg', 'Pothole example')}
                >
  <Image src="/placeholders/pothole.jpg" alt="Pothole example" width={400} height={300} className="w-full h-full object-cover rounded-t-lg group-hover:opacity-80 transition-opacity duration-200" />
  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
    <div className="bg-black/50 rounded-full p-2">
      <ZoomIn size={24} className="text-white" />
    </div>
  </div>
</div>
                <div className="p-4 border-t border-gray-200 dark:border-white/20">
                  <h4 className="font-bold mb-1">Potholes</h4>
                  <p className="text-sm text-foreground/70">
                    Bowl-shaped holes of various sizes in the pavement surface, caused by water infiltration, freeze-thaw cycles, and traffic loading. Requires immediate repair.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Severity Levels */}
          <div>
            <h3 className="text-lg font-semibold mb-6 inline-flex items-center">
              <div className="w-2 h-8 bg-dalan-yellow rounded-full mr-3"></div>
              Severity Classification
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <div className="bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20 dark:to-transparent p-6 rounded-lg border border-green-100 dark:border-green-500/20">
                <div className="flex items-center mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <h4 className="font-bold text-lg">Minor Severity</h4>
                </div>
                <p className="text-sm text-foreground/70">
                  Small, narrow cracks with minimal deterioration. Width typically less than 6mm with no spalling or secondary cracks. Requires monitoring but no immediate action.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-red-50 to-transparent dark:from-red-900/20 dark:to-transparent p-6 rounded-lg border border-red-100 dark:border-red-500/20">
                <div className="flex items-center mb-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <h4 className="font-bold text-lg">Major Severity</h4>
                </div>
                <p className="text-sm text-foreground/70">
                  Wide, deep cracks with significant deterioration. Width typically greater than 6mm with spalling or water infiltration. Requires immediate attention to prevent further damage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer is now in layout.tsx */}
      
      {/* Image Viewer */}
      <ImageViewer 
        isOpen={viewerOpen} 
        onClose={() => setViewerOpen(false)} 
        imageUrl={currentImage.url} 
        altText={currentImage.alt} 
      />
    </main>
  );
}
