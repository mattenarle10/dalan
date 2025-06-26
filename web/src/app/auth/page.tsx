'use client'

import { useState } from 'react'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isLogin) {
      // Handle login logic
      console.log('Login with:', { email, password })
    } else {
      // Handle signup logic
      console.log('Signup with:', { name, email, password })
    }
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 touch-manipulation"
                >
                  {showPassword ? (
                    <EyeOff size={18} className="text-foreground/50 hover:text-foreground/70" />
                  ) : (
                    <Eye size={18} className="text-foreground/50 hover:text-foreground/70" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button - using theme variables for black/white switching */}
            <button
              type="submit"
              className="w-full bg-primary border border-border hover:bg-primary/80 text-primary-foreground py-2.5 px-3 rounded-md transition-colors mt-3 flex items-center justify-center gap-2 text-base">
              {isLogin ? 'Log In' : 'Create an Account'}
            </button>
             {/* Google button - with border and theme-aware text */}
            <button
              type="button"
              className="w-full bg-transparent border border-border hover:bg-background/5 text-foreground py-2.5 px-3 rounded-md transition-colors mt-3 flex items-center justify-center gap-2 text-base"
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
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
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
