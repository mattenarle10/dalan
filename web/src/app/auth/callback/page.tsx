'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback by exchanging the code for a session
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth?error=callback_failed')
          return
        }

        if (data.session) {
          // Successfully authenticated, redirect to dashboard
          console.log('OAuth successful, redirecting to dashboard')
          router.push('/dashboard')
        } else {
          // Try to handle URL fragments for OAuth (fallback)
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          if (accessToken) {
            // Set the session manually if we got tokens from URL
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            })
            
            if (sessionError) {
              console.error('Session error:', sessionError)
              router.push('/auth?error=session_failed')
            } else {
              console.log('Session set successfully, redirecting to dashboard')
              router.push('/dashboard')
            }
          } else {
            // No session and no tokens, redirect back to auth
            console.log('No session found, redirecting to auth')
            router.push('/auth')
          }
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        router.push('/auth?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
        <p className="text-xs text-muted-foreground/70">Processing OAuth callback</p>
      </div>
    </div>
  )
} 