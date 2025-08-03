'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

interface UseAuthGuardOptions {
  requireAuth?: boolean
  requireRole?: 'admin' | 'user'
  redirectTo?: string
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { 
    requireAuth = true, 
    requireRole, 
    redirectTo = '/auth/login' 
  } = options

  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Check authentication requirement
    if (requireAuth && !user) {
      toast.error('Please sign in to access this page')
      router.push(redirectTo)
      return
    }

    // Check role requirement
    if (requireRole && profile && profile.role !== requireRole) {
      toast.error(`Access denied. ${requireRole} privileges required.`)
      router.push('/dashboard')
      return
    }

    // If user is authenticated but no profile exists, redirect to setup
    if (user && !profile && !loading) {
      console.warn('User exists but no profile found')
      // Could redirect to profile setup page or handle gracefully
    }
  }, [user, profile, loading, requireAuth, requireRole, redirectTo, router])

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    hasRole: (role: string) => profile?.role === role,
    isAdmin: profile?.role === 'admin',
    isUser: profile?.role === 'user'
  }
}
