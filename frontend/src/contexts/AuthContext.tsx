'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { User, Session, AuthError } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ data: { user: User | null; session: Session | null; } | { user: null; session: null; }; error: AuthError | null; }>
  signIn: (email: string, password: string) => Promise<{ data: { user: User; session: Session; } | { user: null; session: null; }; error: AuthError | null; }>
  signInWithGoogle: () => Promise<{ data: { provider: string; url: string; } | { provider: string; url: null; }; error: AuthError | null; }>
  signOut: () => Promise<{ error: AuthError | null }>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  
  const value = {
    ...auth,
    isAuthenticated: !!auth.user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
} 