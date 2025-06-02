'use client'
import { useRef, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import Map component to avoid SSR issues
const Map = dynamic(
  () => import("@/components/Map"),
  { ssr: false, loading: () => <div className="w-full h-80 bg-gray-100 animate-pulse rounded-lg"></div> }
);

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 pt-20 pb-24 md:pt-24 md:pb-8">
      
      {/* Map Container */}
      <div className="w-full max-w-2xl h-80 rounded-lg overflow-hidden shadow-md border border-dalan-yellow mb-8 bg-card">
        <Map 
          initialCenter={[120.9842, 14.5995]} /* Manila coordinates [longitude, latitude] */
          zoom={13}
          markers={[
            {
              position: [120.9842, 14.5995],
              popup: "Sample road crack location"
            }
          ]}
        />
      </div>
      <div className="w-full max-w-xs">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center px-6 py-10 rounded-lg cursor-pointer transition bg-dalan-gray border-2 border-dashed border-foreground hover:opacity-90"
        >
          <svg
            className="w-10 h-10 mb-2 text-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16.5 12.25 12 7.75m0 0-4.5 4.5M12 7.75v8.5"
            />
          </svg>
          <span className="mb-1 text-foreground">Click to upload</span>
          <span className="text-xs text-foreground opacity-70">PNG, JPG, JPEG</span>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        {fileName && (
          <div className="mt-2 text-center text-sm text-foreground">Selected: {fileName}</div>
        )}
      </div>
    </div>
  );
}
