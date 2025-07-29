import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import dynamic from "next/dynamic";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dalan — AI Powered Road Crack Mapping App",
  description: "AI powered road crack mapping app",
};

// Dynamically import components to avoid SSR issues with interactive elements
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: true });
const Footer = dynamic(() => import("@/components/Footer"), { ssr: true });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <div className="hidden sm:block">
              <Footer />
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
