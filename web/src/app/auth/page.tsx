'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, User, Eye, EyeOff, Loader } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, signUp, signIn, signInWithGoogle, loading } = useAuthContext()
  
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Check for URL error parameters
  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) {
      switch (urlError) {
        case 'callback_failed':
          setError('Authentication failed. Please try again.')
          break
        case 'session_failed':
          setError('Failed to create session. Please try again.')
          break
        case 'unexpected_error':
          setError('An unexpected error occurred. Please try again.')
          break
        default:
          setError('Authentication error. Please try again.')
      }
    }
  }, [searchParams])

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Password validation
  const passwordsMatch = password === confirmPassword
  const showPasswordError = !isLogin && confirmPassword && !passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match for signup
    if (!isLogin && !passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)

    try {
      if (isLogin) {
        // Handle login
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        } else {
          router.push('/dashboard')
        }
      } else {
        // Handle signup
        const { error } = await signUp(email, password, name)
        if (error) {
          setError(error.message)
        } else {
          // Check email message or redirect
          setError('')
          alert('Check your email for verification link!')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        // Handle specific OAuth errors
        if (error.message.includes('provider is not enabled')) {
          setError('Google sign-in is not configured. Please contact support or use email/password.')
        } else {
          setError(error.message)
        }
      }
      // Redirect will be handled by the auth provider
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
    }
  }

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render form if user is authenticated (will redirect)
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 pt-26 pb-24 md:pt-24 md:pb-8 bg-background">
      
      {/* Auth container */}
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            {isLogin 
              ? 'Sign in to your dalan account' 
              : 'Join dalan to start tracking road cracks'}
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-4 md:p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field - only for signup */}
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User size={18} className="text-foreground/50" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    placeholder="Enter your name"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail size={18} className="text-foreground/50" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholder="Enter your email"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock size={18} className="text-foreground/50" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholder={isLogin ? "Enter your password" : "Create a password"}
                  required
                  disabled={isSubmitting}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 touch-manipulation"
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff size={18} className="text-foreground/50 hover:text-foreground/70" />
                  ) : (
                    <Eye size={18} className="text-foreground/50 hover:text-foreground/70" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password field - only for signup */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock size={18} className="text-foreground/50" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-10 pr-10 w-full rounded-md border px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      showPasswordError 
                        ? 'border-destructive focus:ring-destructive/50' 
                        : 'border-input focus:ring-ring'
                    } bg-background`}
                    placeholder="Confirm your password"
                    required
                    disabled={isSubmitting}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 touch-manipulation"
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} className="text-foreground/50 hover:text-foreground/70" />
                    ) : (
                      <Eye size={18} className="text-foreground/50 hover:text-foreground/70" />
                    )}
                  </button>
                </div>
                {/* Password match indicator */}
                {confirmPassword && (
                  <div className="mt-1.5">
                    {passwordsMatch ? (
                      <p className="text-xs text-green-600 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></span>
                        Passwords match
                      </p>
                    ) : (
                      <p className="text-xs text-destructive flex items-center">
                        <span className="w-1.5 h-1.5 bg-destructive rounded-full mr-2"></span>
                        Passwords do not match
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || (!isLogin && !passwordsMatch)}
              className="w-full bg-primary border border-border hover:bg-primary/80 text-primary-foreground py-2.5 px-3 rounded-md transition-colors mt-3 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Log In' : 'Create an Account'
              )}
            </button>

            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full bg-transparent border border-border hover:bg-background/5 text-foreground py-2.5 px-3 rounded-md transition-colors mt-3 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              {isLogin ? 'Continue with Google' : 'Continue with Google'}
            </button>
          </form>

          {/* Toggle between login and signup */}
          <div className="mt-6 text-center text-sm md:text-base">
            <p className="text-foreground/70">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                  setPassword('')
                  setConfirmPassword('')
                }}
                className="text-primary hover:underline font-medium"
                disabled={isSubmitting}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
