"use client";

import Image from "next/image";
import Link from "next/link";
import { User, LogOut, Calendar, ArrowRight } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthContext } from "@/contexts/AuthContext";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, signOut } = useAuthContext();

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect will be handled by auth context/provider
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  // Get user metadata (extract name from email if no display name)
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown';
  const userImage = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 pt-22 pb-24 md:pt-24 md:pb-8">
      <div className="container mx-auto max-w-4xl w-full">
      <div className="flex justify-center">
        <div className="w-full md:w-3/4 bg-background border border-border rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex flex-col items-center space-y-5">
              {/* Avatar */}
              <div className="h-28 w-28 rounded-full border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
                {userImage ? (
                  <Image 
                    src={userImage} 
                    alt={userName}
                    width={112}
                    height={112}
                    className="object-cover"
                  />
                ) : (
                  <User size={48} className="text-muted-foreground" />
                )}
              </div>
              
              {/* User info */}
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-1 text-foreground">
                  {userName}
                </h2>
                <p className="text-md text-muted-foreground mb-2">
                  {userEmail}
                </p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                  Member
                </span>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="py-6 px-6 md:px-8">
            <div className="space-y-6">
              {/* Account Information */}
              <div className="space-y-3 p-4 bg-card rounded-lg border border-border">
                <div className="flex items-center text-card-foreground">
                  <Calendar size={16} className="mr-2" />
                  <h3 className="font-medium">Account Information</h3>
                </div>
                <p className="text-sm flex justify-between text-foreground">
                  <span className="text-muted-foreground">Member since:</span> 
                  <span>{memberSince}</span>
                </p>
                <p className="text-sm flex justify-between text-foreground">
                  <span className="text-muted-foreground">User ID:</span> 
                  <span className="font-mono text-xs">{user?.id}</span>
                </p>
              </div>
              
              {/* Activity */}
              <div className="space-y-3 p-4 bg-card rounded-lg border border-border">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-card-foreground">
                    <Calendar size={16} className="mr-2" />
                    <h3 className="font-medium">Activity</h3>
                  </div>
                  <Link href="/dashboard?view=my" className="flex items-center text-sm text-primary hover:underline">
                    View my entries
                    <ArrowRight size={14} className="ml-1" />
                  </Link>
                </div>
                <p className="text-sm flex justify-between text-foreground">
                  <span className="text-muted-foreground">Authentication provider:</span> 
                  <span className="capitalize">{user?.app_metadata?.provider || 'email'}</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="py-5 px-6 md:px-8 border-t border-border">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive transition-colors"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}