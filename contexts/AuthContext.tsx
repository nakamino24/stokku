'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/database.types'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  // Check if we should use Supabase based on environment variable
  const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE !== 'false'

  const refreshProfile = async () => {
    if (!user || !useSupabase) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) {
        // If the profiles table doesn't exist or user profile doesn't exist, don't throw
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn('Profiles table or user profile not found. Skipping profile fetch.')
          return
        }
        throw error
      }
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Don't throw error, just log it and continue without profile
      setProfile(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!useSupabase) {
      throw new Error('Authentication is not available in sample data mode')
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    
    // Profile will be loaded by the auth state change listener
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!useSupabase) {
      throw new Error('Authentication is not available in sample data mode')
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'user',
        }
      }
    })

    if (error) throw error

    // Fallback: Create profile manually if trigger doesn't work
    if (data.user && !error) {
      try {
        // Wait a bit for trigger to potentially work
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()
        
        // If no profile exists, create it manually
        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email || email,
              full_name: fullName,
              role: 'user'
            })
          
          if (profileError) {
            console.error('Profile creation error:', profileError)
            // Don't throw error here, let user continue
          }
        }
      } catch (profileError) {
        console.error('Profile fallback error:', profileError)
        // Don't throw error, let signup succeed
      }
    }
  }

  const signOut = async () => {
    if (!useSupabase) {
      throw new Error('Authentication is not available in sample data mode')
    }
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    setUser(null)
    setProfile(null)
  }

  useEffect(() => {
    // Skip auth operations when Supabase is disabled
    if (!useSupabase) {
      setLoading(false)
      return
    }
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await refreshProfile()
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await refreshProfile()
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Refresh profile when user changes
  useEffect(() => {
    if (user && !profile) {
      refreshProfile()
    }
  }, [user])

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
